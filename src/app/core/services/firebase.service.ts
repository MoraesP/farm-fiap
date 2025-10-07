import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { Auth, getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private auth: Auth;

  constructor() {
    // Inicializa o Firebase
    const app = initializeApp(environment.firebase);

    // Obtém a instância de autenticação
    this.auth = getAuth(app);
  }

  /**
   * Retorna a instância de autenticação do Firebase
   */
  getAuth(): Auth {
    return this.auth;
  }

  /**
   * Observa mudanças no estado de autenticação
   * @param callback Função a ser chamada quando o estado de autenticação mudar
   * @returns Função para cancelar a inscrição
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }
}
