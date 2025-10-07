import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

interface User {
  email: string;
  name?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Verificar se há um usuário no localStorage ao inicializar
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(email: string, password: string): Observable<User> {
    // Simulação de login - em um cenário real, isso seria uma chamada HTTP
    // para um backend de autenticação
    if (email && password) {
      const user: User = { email };
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      return of(user);
    }
    return of({ email: '' });
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
