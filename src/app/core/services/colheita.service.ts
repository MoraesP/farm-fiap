import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { from, map, Observable, switchMap } from 'rxjs';
import { LocalArmazenamento } from '../models/armazenamento.model';
import { ProdutoColhido } from '../models/colheita.model';
import { ArmazenamentoService } from './armazenamento.service';
import { FirebaseService } from './firebase.service';
import { PlantacaoService } from './plantacao.service';

@Injectable({
  providedIn: 'root',
})
export class ColheitaService {
  private readonly COLECAO = 'produtos_colhidos';

  constructor(
    private firebaseService: FirebaseService,
    private plantacaoService: PlantacaoService,
    private armazenamentoService: ArmazenamentoService
  ) {}

  /**
   * Obtém todos os produtos colhidos de uma fazenda
   */
  obterProdutosColhidos(fazendaId: string): Observable<ProdutoColhido[]> {
    const firestore = this.firebaseService.getFirestore();
    const produtosRef = collection(firestore, this.COLECAO);
    const q = query(produtosRef, where('fazendaId', '==', fazendaId));

    return new Observable<ProdutoColhido[]>((observer) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const produtos = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              nome: data['nome'],
              tipo: data['tipo'],
              quantidade: data['quantidade'],
              plantacaoId: data['plantacaoId'],
              plantacaoNome: data['plantacaoNome'],
              localArmazenamentoId: data['localArmazenamentoId'],
              localArmazenamentoNome: data['localArmazenamentoNome'],
              fazendaId: data['fazendaId'],
              fazendaNome: data['fazendaNome'],
              dataColheita: data['dataColheita']?.toDate(),
              createdAt: data['createdAt']?.toDate(),
              updatedAt: data['updatedAt']?.toDate(),
            } as ProdutoColhido;
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
   * Registra um novo produto colhido e atualiza o local de armazenamento
   */
  registrarColheita(
    produto: Omit<ProdutoColhido, 'id' | 'createdAt' | 'updatedAt'>,
    local: LocalArmazenamento
  ): Observable<ProdutoColhido> {
    const firestore = this.firebaseService.getFirestore();
    const produtosRef = collection(firestore, this.COLECAO);
    const agora = Timestamp.now();

    // Preparar dados do produto
    const novoProduto = {
      ...produto,
      dataColheita: Timestamp.fromDate(produto.dataColheita),
      createdAt: agora,
      updatedAt: agora,
    };

    // Atualizar local de armazenamento
    const localAtualizado: Partial<LocalArmazenamento> = {
      capacidadeUtilizada: local.capacidadeUtilizada + produto.quantidade,
      fazendaId: produto.fazendaId,
      fazendaNome: produto.fazendaNome,
      updatedAt: new Date(),
    };

    // Primeiro atualizar o local de armazenamento
    return from(
      this.armazenamentoService.atualizarLocalArmazenamento(
        local.id!,
        localAtualizado
      )
    ).pipe(
      // Marcar a plantação como colhida
      switchMap(() => {
        return this.plantacaoService.marcarComoColhida(produto.plantacaoId);
      }),
      // Depois registrar o produto colhido
      switchMap(() => {
        return from(addDoc(produtosRef, novoProduto)).pipe(
          map((docRef) => {
            return {
              id: docRef.id,
              ...produto,
              createdAt: agora.toDate(),
              updatedAt: agora.toDate(),
            };
          })
        );
      })
    );
  }
}
