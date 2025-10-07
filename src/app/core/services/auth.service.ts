import { Injectable, OnDestroy } from '@angular/core';
import {
  User as FirebaseUser,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';

interface User {
  email: string;
  uid: string;
  displayName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private unsubscribeAuth: (() => void) | null = null;

  constructor(private firebaseService: FirebaseService) {
    // Observar mudanças no estado de autenticação do Firebase
    this.unsubscribeAuth = this.firebaseService.onAuthStateChanged(
      (firebaseUser) => {
        const user = this.mapFirebaseUser(firebaseUser);
        this.currentUserSubject.next(user);

        if (user) {
          localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
          localStorage.removeItem('currentUser');
        }
      }
    );

    // Verificar se há um usuário no localStorage ao inicializar
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  ngOnDestroy(): void {
    // Cancelar a inscrição ao destruir o serviço
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
  }

  private mapFirebaseUser(firebaseUser: FirebaseUser | null): User | null {
    if (!firebaseUser) return null;

    return {
      email: firebaseUser.email || '',
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || undefined,
    };
  }

  login(email: string, password: string): Observable<User> {
    const auth = this.firebaseService.getAuth();

    return from(signInWithEmailAndPassword(auth, email, password)).pipe(
      map((userCredential: UserCredential) => {
        const user = this.mapFirebaseUser(userCredential.user);
        if (!user) {
          throw new Error('Falha na autenticação');
        }
        return user;
      }),
      catchError((error) => {
        console.error('Erro no login:', error);
        throw error;
      })
    );
  }

  register(email: string, password: string): Observable<User> {
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

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
