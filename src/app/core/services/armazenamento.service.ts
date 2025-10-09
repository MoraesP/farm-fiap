import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { from, map, Observable } from 'rxjs';
import { LocalArmazenamento } from '../models/armazenamento.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class ArmazenamentoService {
  private readonly LOCAIS_ARMAZENAMENTO = 'locais_armazenamento';

  constructor(private firebaseService: FirebaseService) {}

  /**
   * Obter todos os locais de armazenamento
   */
  obterLocaisArmazenamento(): Observable<LocalArmazenamento[]> {
    const firestore = this.firebaseService.getFirestore();
    const locaisRef = collection(firestore, this.LOCAIS_ARMAZENAMENTO);

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
   * Cadastrar um novo local de armazenamento
   */
  cadastrarLocalArmazenamento(
    local: Omit<LocalArmazenamento, 'id' | 'createdAt' | 'updatedAt'>
  ): Observable<LocalArmazenamento> {
    const firestore = this.firebaseService.getFirestore();
    const locaisRef = collection(firestore, this.LOCAIS_ARMAZENAMENTO);
    const agora = Timestamp.now();

    const novoLocal = {
      ...local,
      capacidadeUtilizada: 0,
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
   * Atualizar um local de armazenamento existente
   */
  atualizarLocalArmazenamento(
    id: string,
    local: Partial<Omit<LocalArmazenamento, 'id' | 'createdAt'>>
  ): Observable<void> {
    const firestore = this.firebaseService.getFirestore();
    const localRef = doc(firestore, this.LOCAIS_ARMAZENAMENTO, id);

    const dadosAtualizados = {
      ...local,
      updatedAt: Timestamp.now(),
    };

    return from(updateDoc(localRef, dadosAtualizados));
  }

  /**
   * Remover um local de armazenamento
   */
  removerLocalArmazenamento(id: string): Observable<void> {
    const firestore = this.firebaseService.getFirestore();
    const localRef = doc(firestore, this.LOCAIS_ARMAZENAMENTO, id);

    return from(deleteDoc(localRef));
  }
}
