import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { from, map, Observable, switchMap } from 'rxjs';
import {
  ArmazenamentoOcupacao,
  LocalArmazenamento,
} from '../models/armazenamento.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class ArmazenamentoService {
  private readonly COLECAO = 'locais_armazenamento';

  constructor(private firebaseService: FirebaseService) {}

  /**
   * Obtém todos os locais de armazenamento
   */
  obterLocaisArmazenamento(): Observable<LocalArmazenamento[]> {
    const firestore = this.firebaseService.getFirestore();
    const locaisRef = collection(firestore, this.COLECAO);

    return new Observable<LocalArmazenamento[]>((observer) => {
      const unsubscribe = onSnapshot(
        locaisRef,
        (snapshot) => {
          const locais = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              nome: data['nome'],
              tipoArmazenamento: data['tipoArmazenamento'],
              capacidadeMaxima: data['capacidadeMaxima'],
              capacidadeUtilizada: data['capacidadeUtilizada'],
              produtoId: data['produtoId'],
              fazendaId: data['fazendaId'],
              fazendaNome: data['fazendaNome'],
              createdAt: data['createdAt']?.toDate(),
              updatedAt: data['updatedAt']?.toDate(),
            } as LocalArmazenamento;
          });
          observer.next(locais);
        },
        (error) => {
          observer.error(error);
        }
      );

      return { unsubscribe };
    });
  }

  /**
   * Cadastra um novo local de armazenamento
   */
  cadastrarLocalArmazenamento(
    local: Omit<LocalArmazenamento, 'id' | 'createdAt' | 'updatedAt'>
  ): Observable<LocalArmazenamento> {
    const firestore = this.firebaseService.getFirestore();
    const locaisRef = collection(firestore, this.COLECAO);
    const agora = Timestamp.now();

    const novoLocal = {
      ...local,
      capacidadeUtilizada: 0, // Inicia com capacidade utilizada zero
      createdAt: agora,
      updatedAt: agora,
    };

    return from(addDoc(locaisRef, novoLocal)).pipe(
      map((docRef) => {
        return {
          id: docRef.id,
          ...novoLocal,
          createdAt: agora.toDate(),
          updatedAt: agora.toDate(),
        };
      })
    );
  }

  /**
   * Atualiza um local de armazenamento existente
   */
  atualizarLocalArmazenamento(
    id: string,
    local: Partial<Omit<LocalArmazenamento, 'id' | 'createdAt'>>
  ): Observable<void> {
    const firestore = this.firebaseService.getFirestore();
    const localRef = doc(firestore, this.COLECAO, id);

    const dadosAtualizados = {
      ...local,
      updatedAt: Timestamp.now(),
    };

    return from(updateDoc(localRef, dadosAtualizados));
  }

  /**
   * Remove um local de armazenamento
   */
  removerLocalArmazenamento(id: string): Observable<void> {
    const firestore = this.firebaseService.getFirestore();
    const localRef = doc(firestore, this.COLECAO, id);

    return from(deleteDoc(localRef));
  }
}
