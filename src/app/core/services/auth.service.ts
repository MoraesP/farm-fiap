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
import { UserProfile } from '../models/user.model';
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

  private mapFirebaseUser(firebaseUser: FirebaseUser): UserProfile {
    let firstName = '';
    let lastName = '';

    if (firebaseUser.displayName) {
      const nameParts = firebaseUser.displayName.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      firstName,
      lastName,
      photoURL: firebaseUser.photoURL || undefined,
      cpf: '',
      birthDate: '',
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
      UserProfile,
      'uid' | 'email' | 'photoURL' | 'createdAt' | 'updatedAt'
    >
  ): Observable<UserProfile> {
    const auth = this.firebaseService.getAuth();
    const firestore = this.firebaseService.getFirestore();

    return from(createUserWithEmailAndPassword(auth, email, password)).pipe(
      switchMap((userCredential: UserCredential) => {
        const user = userCredential.user;
        const displayName = `${profileData.firstName} ${profileData.lastName}`;
        return from(updateProfile(user, { displayName })).pipe(map(() => user));
      }),
      switchMap((user) => {
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          cpf: profileData.cpf,
          birthDate: profileData.birthDate,
          photoURL: user.photoURL || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const userDocRef = doc(firestore, 'users', user.uid);
        return from(setDoc(userDocRef, userProfile)).pipe(
          map(() => userProfile)
        );
      }),
      tap((profile) => this.userState.definirUsuarioAutenticado(profile))
    );
  }

  getUserProfile(uid: string): Observable<UserProfile | null> {
    const firestore = this.firebaseService.getFirestore();
    const userDocRef = doc(firestore, 'users', uid);

    return from(getDoc(userDocRef)).pipe(
      map((docSnap) => {
        if (docSnap.exists()) {
          return docSnap.data() as UserProfile;
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
