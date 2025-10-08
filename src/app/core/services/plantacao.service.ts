import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { Observable, from, map } from 'rxjs';
import { CompraInsumo } from '../models/insumo.model';
import { Plantacao } from '../models/plantacao.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class PlantacaoService {
  constructor(private firebaseService: FirebaseService) {}

  getPlantacoes(cooperadoUid: string): Observable<Plantacao[]> {
    const firestore = this.firebaseService.getFirestore();
    const plantacoesRef = collection(firestore, 'plantacoes');
    const q = query(plantacoesRef, where('cooperadoUid', '==', cooperadoUid));

    return new Observable<Plantacao[]>((observer) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const plantacoes: Plantacao[] = [];
          querySnapshot.forEach((doc) => {
            plantacoes.push({
              id: doc.id,
              ...doc.data(),
            } as Plantacao);
          });
          observer.next(plantacoes);
        },
        (error) => {
          observer.error(error);
        }
      );

      return { unsubscribe };
    });
  }

  registrarPlantacao(
    compraId: string,
    insumoId: string,
    insumoNome: string,
    quantidadePlantada: number,
    cooperadoUid: string,
    cooperadoNome: string
  ): Observable<Plantacao> {
    const firestore = this.firebaseService.getFirestore();
    const plantacoesRef = collection(firestore, 'plantacoes');

    const novaPlantacao: Omit<Plantacao, 'id'> = {
      compraId,
      insumoId,
      insumoNome,
      quantidadePlantada,
      dataPlantio: new Date(),
      cooperadoUid,
      cooperadoNome,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return from(addDoc(plantacoesRef, novaPlantacao)).pipe(
      map((docRef) => {
        return { id: docRef.id, ...novaPlantacao } as Plantacao;
      })
    );
  }

  atualizarQuantidadeInsumo(
    compraId: string,
    cooperadoUid: string,
    quantidadePlantada: number
  ): Observable<void> {
    const firestore = this.firebaseService.getFirestore();

    // Importar as funções necessárias do Firebase
    return from(
      import('firebase/firestore').then(({ doc, getDoc, updateDoc }) => {
        const compraRef = doc(firestore, 'compras_insumos', compraId);

        // Primeiro, obter o documento atual
        return getDoc(compraRef).then((docSnap) => {
          if (!docSnap.exists()) {
            throw new Error('Compra não encontrada');
          }

          const compra = docSnap.data() as CompraInsumo;
          const itens = compra.itens || [];

          // Encontrar o item do usuário específico
          const itemIndex = itens.findIndex(
            (item: any) => item.cooperadoUid === cooperadoUid
          );

          if (itemIndex === -1) {
            throw new Error('Item do usuário não encontrado na compra');
          }

          // Atualizar a quantidade usada para o item específico
          const novaQuantidadeUsada =
            (itens[itemIndex].quantidadeUsada || 0) + quantidadePlantada;

          // Criar um novo array de itens com o item atualizado
          const novosItens = [...itens];
          novosItens[itemIndex] = {
            ...novosItens[itemIndex],
            quantidadeUsada: novaQuantidadeUsada,
          };

          // Atualizar o documento com os novos itens
          return updateDoc(compraRef, {
            itens: novosItens,
            updatedAt: new Date(),
          });
        });
      })
    );
  }
}
