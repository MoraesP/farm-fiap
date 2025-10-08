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
  private readonly COLECAO_OCUPACAO = 'armazenamento_ocupacao';

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
   * Obtém locais de armazenamento por fazenda
   */
  obterLocaisArmazenamentoPorFazenda(
    fazendaId: string
  ): Observable<LocalArmazenamento[]> {
    const firestore = this.firebaseService.getFirestore();
    const locaisRef = collection(firestore, this.COLECAO);
    const q = query(locaisRef, where('fazendaId', '==', fazendaId));

    return new Observable<LocalArmazenamento[]>((observer) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const locais = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              nome: data['nome'],
              tipoArmazenamento: data['tipoArmazenamento'],
              capacidadeMaxima: data['capacidadeMaxima'],
              capacidadeUtilizada: data['capacidadeUtilizada'],
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

  /**
   * Adiciona ocupação a um local de armazenamento
   */
  adicionarOcupacao(
    localId: string,
    ocupacao: ArmazenamentoOcupacao
  ): Observable<void> {
    const firestore = this.firebaseService.getFirestore();

    return from(getDoc(doc(firestore, this.COLECAO, localId))).pipe(
      switchMap((docSnap) => {
        if (!docSnap.exists()) {
          throw new Error('Local de armazenamento não encontrado');
        }

        const localData = docSnap.data() as LocalArmazenamento;
        const novaCapacidade =
          localData.capacidadeUtilizada + ocupacao.quantidade;

        if (novaCapacidade > localData.capacidadeMaxima) {
          throw new Error('Capacidade máxima excedida');
        }

        // Atualizar a capacidade utilizada
        const updatePromise = updateDoc(doc(firestore, this.COLECAO, localId), {
          capacidadeUtilizada: novaCapacidade,
          updatedAt: Timestamp.now(),
        });

        // Registrar a ocupação
        const ocupacaoData = {
          ...ocupacao,
          localArmazenamentoId: localId,
          dataArmazenamento: Timestamp.now(),
        };

        const addPromise = addDoc(
          collection(firestore, this.COLECAO_OCUPACAO),
          ocupacaoData
        );

        // Retornar um Observable vazio após ambas as operações serem concluídas
        return from(Promise.all([updatePromise, addPromise])).pipe(
          map(() => undefined)
        );
      })
    );
  }

  /**
   * Obtém a ocupação de um local de armazenamento
   */
  obterOcupacao(localId: string): Observable<ArmazenamentoOcupacao[]> {
    const firestore = this.firebaseService.getFirestore();
    const ocupacaoRef = collection(firestore, this.COLECAO_OCUPACAO);
    const q = query(ocupacaoRef, where('localArmazenamentoId', '==', localId));

    return from(getDocs(q)).pipe(
      map((snapshot) => {
        return snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            insumoId: data['insumoId'],
            insumoNome: data['insumoNome'],
            quantidade: data['quantidade'],
            dataArmazenamento: data['dataArmazenamento'].toDate(),
          } as ArmazenamentoOcupacao & { id: string };
        });
      })
    );
  }
}
