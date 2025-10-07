import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private auth: Auth;
  private googleProvider: GoogleAuthProvider;

  constructor() {
    // Inicializa o Firebase
    const app = initializeApp(environment.firebase);

    // Obtém a instância de autenticação
    this.auth = getAuth(app);

    // Inicializa o provedor do Google
    this.googleProvider = new GoogleAuthProvider();
    // Configurações opcionais para o provedor do Google
    this.googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
  }

  /**
   * Retorna a instância de autenticação do Firebase
   */
  getAuth(): Auth {
    return this.auth;
  }

  /**
   * Retorna o provedor de autenticação do Google
   */
  getGoogleProvider(): GoogleAuthProvider {
    return this.googleProvider;
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
