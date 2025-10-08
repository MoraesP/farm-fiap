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
import { ItemCompraInsumo } from '../models/insumo.model';
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
    itemInsumo: ItemCompraInsumo,
    quantidadePlantada: number,
    cooperadoUid: string,
    cooperadoNome: string
  ): Observable<Plantacao> {
    const firestore = this.firebaseService.getFirestore();
    const plantacoesRef = collection(firestore, 'plantacoes');

    const novaPlantacao: Omit<Plantacao, 'id'> = {
      insumoId: itemInsumo.insumo.id!,
      insumoNome: itemInsumo.insumo.nome,
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
    itemInsumo: ItemCompraInsumo,
    quantidadePlantada: number
  ): Observable<void> {
    const firestore = this.firebaseService.getFirestore();
    const compraItemRef = doc(
      firestore,
      'compras_insumos',
      itemInsumo.insumo.id!
    );

    // Atualizar a quantidade do insumo (subtrair a quantidade plantada)
    const novaQuantidade = itemInsumo.quantidade - quantidadePlantada;

    return from(
      updateDoc(compraItemRef, {
        quantidade: novaQuantidade,
        updatedAt: new Date(),
      })
    );
  }
}
