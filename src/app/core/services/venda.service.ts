import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { from, Observable, switchMap } from 'rxjs';
import { LocalArmazenamento } from '../models/armazenamento.model';
import { Venda } from '../models/venda.model';
import { ArmazenamentoService } from './armazenamento.service';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class VendaService {
  private readonly COLECAO = 'vendas';

  constructor(
    private firebaseService: FirebaseService,
    private armazenamentoService: ArmazenamentoService
  ) {}

  /**
   * Registra uma nova venda e atualiza o local de armazenamento
   */
  registrarVenda(
    venda: Omit<Venda, 'id' | 'createdAt' | 'updatedAt'>,
    local: LocalArmazenamento
  ): Observable<Venda> {
    const firestore = this.firebaseService.getFirestore();
    const vendasRef = collection(firestore, this.COLECAO);
    const agora = Timestamp.now();

    // Preparar dados da venda
    const novaVenda = {
      ...venda,
      dataVenda: Timestamp.fromDate(venda.dataVenda),
      createdAt: agora,
      updatedAt: agora,
    };

    // Calcular nova capacidade utilizada
    const novaCapacidade = local.capacidadeUtilizada - venda.quantidade;

    // Preparar atualização do local de armazenamento
    const localAtualizado: Partial<LocalArmazenamento> = {
      capacidadeUtilizada: novaCapacidade,
      updatedAt: new Date(),
    };

    // Se vendeu tudo, remover as referências ao produto e fazenda
    if (novaCapacidade <= 0) {
      localAtualizado.produtoId = null;
      localAtualizado.fazendaId = null;
      localAtualizado.fazendaNome = null;
      localAtualizado.capacidadeUtilizada = 0; // Garantir que não fique negativo
    }

    // Primeiro atualizar o local de armazenamento
    return from(
      this.armazenamentoService.atualizarLocalArmazenamento(
        local.id!,
        localAtualizado
      )
    ).pipe(
      // Depois registrar a venda
      switchMap(() => {
        return from(addDoc(vendasRef, novaVenda)).pipe(
          switchMap((docRef) => {
            // Retornar os dados da venda com o ID
            return from(
              getDocs(
                query(vendasRef, where('__name__', '==', docRef.id))
              )
            ).pipe(
              switchMap((snapshot) => {
                if (snapshot.docs.length > 0) {
                  const data = snapshot.docs[0].data();
                  const vendaRegistrada: Venda = {
                    id: docRef.id,
                    produtoId: data['produtoId'],
                    produtoNome: data['produtoNome'],
                    quantidade: data['quantidade'],
                    regiao: data['regiao'],
                    localArmazenamentoId: data['localArmazenamentoId'],
                    fazendaId: data['fazendaId'],
                    fazendaNome: data['fazendaNome'],
                    dataVenda: data['dataVenda'].toDate(),
                    createdAt: data['createdAt']?.toDate(),
                    updatedAt: data['updatedAt']?.toDate(),
                  };
                  return from([vendaRegistrada]);
                } else {
                  throw new Error('Venda não encontrada após registro');
                }
              })
            );
          })
        );
      })
    );
  }

  /**
   * Obtém todas as vendas de uma fazenda
   */
  obterVendas(fazendaId: string): Observable<Venda[]> {
    const firestore = this.firebaseService.getFirestore();
    const vendasRef = collection(firestore, this.COLECAO);
    const q = query(vendasRef, where('fazendaId', '==', fazendaId));

    return from(getDocs(q)).pipe(
      switchMap((snapshot) => {
        const vendas = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            produtoId: data['produtoId'],
            produtoNome: data['produtoNome'],
            quantidade: data['quantidade'],
            regiao: data['regiao'],
            localArmazenamentoId: data['localArmazenamentoId'],
            fazendaId: data['fazendaId'],
            fazendaNome: data['fazendaNome'],
            dataVenda: data['dataVenda'].toDate(),
            createdAt: data['createdAt']?.toDate(),
            updatedAt: data['updatedAt']?.toDate(),
          } as Venda;
        });
        return from([vendas]);
      })
    );
  }
}
