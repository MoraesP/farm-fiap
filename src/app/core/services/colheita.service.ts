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
  private readonly PRODUTOS_COLHIDOS = 'produtos_colhidos';

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
    const produtosRef = collection(firestore, this.PRODUTOS_COLHIDOS);
    const q = query(produtosRef, where('fazendaId', '==', fazendaId));

    return new Observable<ProdutoColhido[]>((observer) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const produtos = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              insumoId: data['insumoId'],
              produtoId: data['produtoId'],
              produtoNome: data['produtoNome'],
              produtoUnidadeMedida: data['produtoUnidadeMedida'],
              quantidade: data['quantidade'],
              plantacaoId: data['plantacaoId'],
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
    produtoColhido: Omit<ProdutoColhido, 'id' | 'createdAt' | 'updatedAt'>,
    local: LocalArmazenamento
  ): Observable<ProdutoColhido> {
    const firestore = this.firebaseService.getFirestore();
    const produtosRef = collection(firestore, this.PRODUTOS_COLHIDOS);
    const agora = Timestamp.now();

    const novoProduto = {
      ...produtoColhido,
      dataColheita: Timestamp.fromDate(produtoColhido.dataColheita),
      createdAt: agora,
      updatedAt: agora,
    };

    const localAtualizado: Partial<LocalArmazenamento> = {
      capacidadeUtilizada:
        local.capacidadeUtilizada + produtoColhido.quantidade,
      produtoId: produtoColhido.produtoId,
      fazendaId: produtoColhido.fazendaId,
      fazendaNome: produtoColhido.fazendaNome,
      updatedAt: new Date(),
    };

    return from(
      this.armazenamentoService.atualizarLocalArmazenamento(
        local.id!,
        localAtualizado
      )
    ).pipe(
      switchMap(() => {
        return this.plantacaoService.marcarComoColhida(
          produtoColhido.plantacaoId
        );
      }),
      switchMap(() => {
        return from(addDoc(produtosRef, novoProduto)).pipe(
          map((docRef) => {
            return {
              id: docRef.id,
              ...produtoColhido,
              createdAt: agora.toDate(),
              updatedAt: agora.toDate(),
            };
          })
        );
      })
    );
  }
}
