import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  Firestore,
  getFirestore,
} from 'firebase/firestore';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private auth: Auth;
  private googleProvider: GoogleAuthProvider;
  private firestore: Firestore;

  constructor() {
    const app = initializeApp(environment.firebase);
    this.auth = getAuth(app);

    this.googleProvider = new GoogleAuthProvider();
    this.googleProvider.setCustomParameters({
      prompt: 'select_account',
    });

    this.firestore = getFirestore(app);
  }

  /**
   * Retornar a instância de autenticação do Firebase
   */
  getAuth(): Auth {
    return this.auth;
  }

  /**
   * Retornar o provedor de autenticação do Google
   */
  getGoogleProvider(): GoogleAuthProvider {
    return this.googleProvider;
  }

  /**
   * Retornar a instância do Firestore
   */
  getFirestore(): Firestore {
    return this.firestore;
  }

  /**
   * Obter uma referência para uma coleção no Firestore
   * @param collectionPath Caminho para a coleção
   */
  getCollection(collectionPath: string): CollectionReference {
    return collection(this.firestore, collectionPath);
  }

  /**
   * Obter uma referência para um documento no Firestore
   * @param collectionPath Caminho para a coleção
   * @param docId ID do documento
   */
  getDocRef(collectionPath: string, docId: string): DocumentReference {
    return doc(this.firestore, collectionPath, docId);
  }

  /**
   * Observar mudanças no estado de autenticação
   * @param callback Função a ser chamada quando o estado de autenticação mudar
   * @returns Função para cancelar a inscrição
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }
}
