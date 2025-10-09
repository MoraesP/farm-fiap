import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
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
  private readonly PLANTACOES = 'plantacoes';

  constructor(private firebaseService: FirebaseService) {}

  getPlantacoes(fazendaId: string): Observable<Plantacao[]> {
    const firestore = this.firebaseService.getFirestore();
    const plantacoesRef = collection(firestore, this.PLANTACOES);
    const q = query(plantacoesRef, where('fazendaId', '==', fazendaId));

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
    cooperadoNome: string,
    fazendaId: string
  ): Observable<Plantacao> {
    const firestore = this.firebaseService.getFirestore();
    const plantacoesRef = collection(firestore, this.PLANTACOES);

    const novaPlantacao: Omit<Plantacao, 'id'> = {
      compraId,
      insumoId,
      insumoNome,
      quantidadePlantada,
      dataPlantio: new Date(),
      cooperadoUid,
      cooperadoNome,
      fazendaId,
      colhida: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return from(addDoc(plantacoesRef, novaPlantacao)).pipe(
      map((docRef) => {
        return { id: docRef.id, ...novaPlantacao } as Plantacao;
      })
    );
  }

  marcarComoColhida(plantacaoId: string): Observable<void> {
    const firestore = this.firebaseService.getFirestore();
    const plantacaoRef = doc(firestore, this.PLANTACOES, plantacaoId);

    const atualizacao = {
      colhida: true,
      dataColheita: new Date(),
      updatedAt: new Date(),
    };

    return from(updateDoc(plantacaoRef, atualizacao));
  }

  atualizarQuantidadeInsumo(
    compraId: string,
    fazendaId: string,
    quantidadePlantada: number
  ): Observable<void> {
    const firestore = this.firebaseService.getFirestore();

    return from(
      import('firebase/firestore').then(({ doc, getDoc, updateDoc }) => {
        const compraRef = doc(firestore, 'compras_insumos', compraId);

        return getDoc(compraRef).then((docSnap) => {
          if (!docSnap.exists()) {
            throw new Error('Compra não encontrada');
          }

          const compra = docSnap.data() as CompraInsumo;
          const itens = compra.itens || [];

          const itemIndex = itens.findIndex(
            (item: any) => item.fazendaId === fazendaId
          );

          if (itemIndex === -1) {
            throw new Error('Item do usuário não encontrado na compra');
          }

          const novaQuantidadeUsada =
            (itens[itemIndex].quantidadeUsada || 0) + quantidadePlantada;

          const novosItens = [...itens];
          novosItens[itemIndex] = {
            ...novosItens[itemIndex],
            quantidadeUsada: novaQuantidadeUsada,
          };

          return updateDoc(compraRef, {
            itens: novosItens,
            updatedAt: new Date(),
          });
        });
      })
    );
  }
}
