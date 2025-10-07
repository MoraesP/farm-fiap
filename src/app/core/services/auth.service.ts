import { Injectable, OnDestroy } from '@angular/core';
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserProfile } from '../models/user.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private unsubscribeAuth: (() => void) | null = null;

  constructor(private firebaseService: FirebaseService) {
    this.unsubscribeAuth = this.firebaseService.onAuthStateChanged(
      (firebaseUser) => {
        if (firebaseUser) {
          this.getUserProfile(firebaseUser.uid).subscribe((userProfile) => {
            if (userProfile) {
              this.currentUserSubject.next(userProfile);
              localStorage.setItem('currentUser', JSON.stringify(userProfile));
            } else {
              const basicUser = this.mapFirebaseUser(firebaseUser);
              this.currentUserSubject.next(basicUser);
              localStorage.setItem('currentUser', JSON.stringify(basicUser));
            }
          });
        } else {
          this.currentUserSubject.next(null);
          localStorage.removeItem('currentUser');
        }
      }
    );

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
  }

  private mapFirebaseUser(firebaseUser: FirebaseUser): UserProfile | null {
    if (!firebaseUser) {
      return null;
    }

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

  login(email: string, password: string): Observable<UserProfile | null> {
    const auth = this.firebaseService.getAuth();

    return from(signInWithEmailAndPassword(auth, email, password)).pipe(
      switchMap((userCredential) => {
        return this.getUserProfile(userCredential.user.uid).pipe(
          map((userProfile) => {
            if (userProfile) {
              return userProfile;
            } else {
              return this.mapFirebaseUser(userCredential.user);
            }
          })
        );
      }),
      catchError((error) => {
        console.error('Erro no login:', error);
        throw error;
      })
    );
  }

  loginWithGoogle(): Observable<UserProfile> {
    const auth = this.firebaseService.getAuth();
    const googleProvider = this.firebaseService.getGoogleProvider();

    return from(signInWithPopup(auth, googleProvider)).pipe(
      switchMap((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        // const token = credential?.accessToken;

        return this.getUserProfile(result.user.uid).pipe(
          switchMap((userProfile) => {
            if (userProfile) {
              return of(userProfile);
            } else {
              const basicProfile = this.mapFirebaseUser(result.user);
              if (!basicProfile) {
                throw new Error('Falha na autenticação com Google');
              }
              // Salvar o Perfil básico no Firestore
              const firestore = this.firebaseService.getFirestore();
              const userDocRef = doc(firestore, 'users', basicProfile.uid);
              return from(setDoc(userDocRef, basicProfile)).pipe(
                map(() => basicProfile)
              );
            }
          })
        );
      }),
      catchError((error) => {
        console.error('Erro no login com Google:', error);
        throw error;
      })
    );
  }

  register(email: string, password: string): Observable<UserProfile> {
    const auth = this.firebaseService.getAuth();

    return from(createUserWithEmailAndPassword(auth, email, password)).pipe(
      map((userCredential: UserCredential) => {
        const user = this.mapFirebaseUser(userCredential.user);
        if (!user) {
          throw new Error('Falha no registro');
        }
        return user;
      }),
      catchError((error) => {
        console.error('Erro no registro:', error);
        throw error;
      })
    );
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
      catchError((error) => {
        console.error('Erro no registro comPerfil:', error);
        throw error;
      })
    );
  }

  getUserProfile(uid: string): Observable<UserProfile | null> {
    const firestore = this.firebaseService.getFirestore();
    const userDocRef = doc(firestore, 'users', uid);

    return from(getDoc(userDocRef)).pipe(
      map((docSnap) => {
        if (docSnap.exists()) {
          return docSnap.data() as UserProfile;
        } else {
          return null;
        }
      }),
      catchError((error) => {
        console.error('Erro ao buscar oPerfil do usuário:', error);
        return of(null);
      })
    );
  }

  logout(): Observable<void> {
    const auth = this.firebaseService.getAuth();
    return from(signOut(auth)).pipe(
      catchError((error) => {
        console.error('Erro no logout:', error);
        throw error;
      })
    );
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  get name(): string {
    const user = this.currentUserSubject.value;
    if (!user) return '';

    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }
}
