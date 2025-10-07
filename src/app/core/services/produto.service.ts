import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Produto } from '../models/produto.model';
import { UserStateService } from '../state/user-state.service';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  private readonly collectionName = 'produtos';

  constructor(
    private firebaseService: FirebaseService,
    private userState: UserStateService
  ) {}

  /**
   * Adiciona um novo produto ao Firestore.
   */
  adicionarProduto(
    dadosProduto: Omit<
      Produto,
      'id' | 'produtorId' | 'produtorNome' | 'dataCadastro'
    >
  ): Observable<Produto> {
    const firestore = this.firebaseService.getFirestore();
    const produtosCollection = collection(firestore, this.collectionName);
    const usuario = this.userState.usuarioAtual;

    if (!usuario) {
      throw new Error('Usuário não autenticado para adicionar produtos.');
    }

    const novoProduto: Omit<Produto, 'id'> = {
      ...dadosProduto,
      produtorId: usuario.uid,
      produtorNome: this.userState.nomeUsuario,
      dataCadastro: new Date(),
    };

    return from(addDoc(produtosCollection, novoProduto)).pipe(
      map((docRef) => ({
        id: docRef.id,
        ...novoProduto,
      }))
    );
  }

  /**
   * Busca todos os produtos cadastrados pelo produtor logado.
   */
  buscarProdutosDoUsuario(): Observable<Produto[]> {
    const firestore = this.firebaseService.getFirestore();
    const produtosCollection = collection(firestore, this.collectionName);
    const usuario = this.userState.usuarioAtual;

    if (!usuario) {
      return from(Promise.resolve([])); // Retorna array vazio se não houver usuário
    }

    const q = query(produtosCollection, where('produtorId', '==', usuario.uid));

    return from(getDocs(q)).pipe(
      map((querySnapshot) => {
        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Produto, 'id'>),
        }));
      })
    );
  }

  /**
   * Atualiza os dados de um produto existente.
   */
  atualizarProduto(id: string, dados: Partial<Produto>): Observable<void> {
    const firestore = this.firebaseService.getFirestore();
    const produtoDocRef = doc(firestore, this.collectionName, id);
    return from(updateDoc(produtoDocRef, dados));
  }

  /**
   * Remove um produto do Firestore.
   */
  removerProduto(id: string): Observable<void> {
    const firestore = this.firebaseService.getFirestore();
    const produtoDocRef = doc(firestore, this.collectionName, id);
    return from(deleteDoc(produtoDocRef));
  }
}
