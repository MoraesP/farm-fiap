import { Injectable, OnDestroy } from '@angular/core';
import {
  User as FirebaseUser,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Perfil, PerfilUsuario } from '../models/user.model';
import { UserStateService } from '../state/user-state.service';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private unsubscribeAuth: (() => void) | null = null;

  constructor(
    private firebaseService: FirebaseService,
    private userState: UserStateService
  ) {
    this.unsubscribeAuth = this.firebaseService.onAuthStateChanged(
      (firebaseUser) => {
        if (firebaseUser) {
          this.handleAuthentication(firebaseUser);
        } else {
          this.userState.limparDadosUsuario();
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
  }

  private handleAuthentication(firebaseUser: FirebaseUser): void {
    this.getUserProfile(firebaseUser.uid).subscribe((userProfile) => {
      const profile = userProfile || this.mapFirebaseUser(firebaseUser);
      if (this.userState.estaComPerfilCompleto(profile)) {
        this.userState.definirUsuarioAutenticado(profile);
      } else {
        this.userState.comecarCompletandoPerfil(profile);
      }
    });
  }

  private mapFirebaseUser(firebaseUser: FirebaseUser): PerfilUsuario {
    let primeiroNome = '';
    let ultimoNome = '';

    if (firebaseUser.displayName) {
      const nameParts = firebaseUser.displayName.split(' ');
      primeiroNome = nameParts[0] || '';
      ultimoNome = nameParts.slice(1).join(' ') || '';
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      primeiroNome,
      ultimoNome,
      cpf: '',
      dataNascimento: '',
      fazenda: undefined,
      perfil: Perfil.COOPERADO,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  login(email: string, password: string): Observable<UserCredential> {
    const auth = this.firebaseService.getAuth();
    return from(signInWithEmailAndPassword(auth, email, password));
  }

  loginWithGoogle(): Observable<UserCredential> {
    const auth = this.firebaseService.getAuth();
    const googleProvider = this.firebaseService.getGoogleProvider();
    return from(signInWithPopup(auth, googleProvider));
  }

  registerWithProfile(
    email: string,
    password: string,
    profileData: Omit<
      PerfilUsuario,
      'uid' | 'email' | 'createdAt' | 'updatedAt'
    >
  ): Observable<PerfilUsuario> {
    const auth = this.firebaseService.getAuth();
    const firestore = this.firebaseService.getFirestore();

    return from(createUserWithEmailAndPassword(auth, email, password)).pipe(
      switchMap((userCredential: UserCredential) => {
        const user = userCredential.user;
        const displayName = `${profileData.primeiroNome} ${profileData.ultimoNome}`;
        return from(updateProfile(user, { displayName })).pipe(map(() => user));
      }),
      switchMap((user) => {
        const perfilUsuario: PerfilUsuario = {
          uid: user.uid,
          email: user.email || '',
          primeiroNome: profileData.primeiroNome,
          ultimoNome: profileData.ultimoNome,
          cpf: profileData.cpf,
          dataNascimento: profileData.dataNascimento,
          perfil: profileData.perfil,
          ...(profileData.fazenda ? { fazenda: profileData.fazenda } : {}),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const userDocRef = doc(firestore, 'users', user.uid);
        return from(setDoc(userDocRef, perfilUsuario)).pipe(
          map(() => perfilUsuario)
        );
      }),
      tap((profile) => this.userState.definirUsuarioAutenticado(profile))
    );
  }

  getUserProfile(uid: string): Observable<PerfilUsuario | null> {
    const firestore = this.firebaseService.getFirestore();
    const userDocRef = doc(firestore, 'users', uid);

    return from(getDoc(userDocRef)).pipe(
      map((docSnap) => {
        if (docSnap.exists()) {
          return docSnap.data() as PerfilUsuario;
        }
        return null;
      })
    );
  }

  logout(): Observable<void> {
    const auth = this.firebaseService.getAuth();
    return from(signOut(auth));
  }
}
