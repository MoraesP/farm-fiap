import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Observable, from, map } from 'rxjs';
import { Produto } from '../models/produto.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  private readonly PRODUTOS = 'produtos';

  constructor(private firebaseService: FirebaseService) {}

  /**
   * Obter todos os produtos disponíveis
   */
  getProdutos(): Observable<Produto[]> {
    const firestore = this.firebaseService.getFirestore();
    const produtosRef = collection(firestore, this.PRODUTOS);

    return new Observable<Produto[]>((observer) => {
      const unsubscribe = onSnapshot(
        produtosRef,
        (snapshot) => {
          const produtos = snapshot.docs.map((doc) => {
            return { id: doc.id, ...doc.data() } as Produto;
          });
          observer.next(produtos);
        },
        (error) => {
          observer.error(error);
        }
      );

      return { unsubscribe };
    });
  }

  /**
   * Obter um produto específico pelo ID
   * @param id ID do produto
   */
  getProduto(id: string): Observable<Produto | null> {
    const firestore = this.firebaseService.getFirestore();
    const produtoDocRef = doc(firestore, this.PRODUTOS, id);
    return from(getDoc(produtoDocRef)).pipe(
      map((docSnap) => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Produto;
        }
        return null;
      })
    );
  }

  /**
   * Adicionar um novo produto
   * @param produto Dados do produto a ser adicionado
   */
  adicionarProduto(
    produto: Omit<Produto, 'id' | 'createdAt' | 'updatedAt'>
  ): Observable<Produto> {
    const firestore = this.firebaseService.getFirestore();
    const produtosRef = collection(firestore, this.PRODUTOS);

    const agora = new Date();
    const novoProduto: Omit<Produto, 'id'> = {
      ...produto,
      createdAt: agora,
      updatedAt: agora,
    };

    return from(addDoc(produtosRef, novoProduto)).pipe(
      map((docRef) => {
        return { id: docRef.id, ...novoProduto } as Produto;
      })
    );
  }

  /**
   * Atualizar um produto existente
   * @param id ID do produto
   * @param produto Dados atualizados do produto
   */
  atualizarProduto(id: string, produto: Partial<Produto>): Observable<void> {
    const firestore = this.firebaseService.getFirestore();
    const produtoDocRef = doc(firestore, this.PRODUTOS, id);

    const dadosAtualizados = {
      ...produto,
      updatedAt: new Date(),
    };

    return from(updateDoc(produtoDocRef, dadosAtualizados));
  }

  /**
   * Remover um produto
   * @param id ID do produto a ser removido
   */
  removerProduto(id: string): Observable<void> {
    const firestore = this.firebaseService.getFirestore();
    const produtoDocRef = doc(firestore, this.PRODUTOS, id);
    return from(deleteDoc(produtoDocRef));
  }

  /**
   * Obter produtos relacionados a um insumo específico
   * @param insumoId ID do insumo
   */
  getProdutosPorInsumo(insumoId: string): Observable<Produto[]> {
    const firestore = this.firebaseService.getFirestore();
    const produtosRef = collection(firestore, this.PRODUTOS);

    return new Observable<Produto[]>((observer) => {
      const unsubscribe = onSnapshot(
        query(produtosRef, where('insumoOrigemId', '==', insumoId)),
        (snapshot) => {
          const produtos = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              nome: data['nome'],
              unidadeMedida: data['unidadeMedida'],
              precoVenda: data['precoVenda'],
              insumoOrigemId: data['insumoOrigemId'],
              insumoOrigemNome: data['insumoOrigemNome'],
              createdAt: data['createdAt']?.toDate(),
              updatedAt: data['updatedAt']?.toDate(),
            } as Produto;
          });
          observer.next(produtos);
        },
        (error) => {
          observer.error(error);
        }
      );

      return { unsubscribe };
    });
  }
}
