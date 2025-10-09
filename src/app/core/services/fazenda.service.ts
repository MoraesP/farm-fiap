import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { from, map, Observable } from 'rxjs';
import { Fazenda } from '../models/user.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class FazendaService {
  private readonly FAZENDAS = 'fazendas';

  constructor(private firebaseService: FirebaseService) {}

  /**
   * Obter todas as fazendas disponíveis
   */
  obterTodasFazendas(): Observable<Fazenda[]> {
    const firestore = this.firebaseService.getFirestore();
    const fazendasRef = collection(firestore, this.FAZENDAS);

    return from(getDocs(fazendasRef)).pipe(
      map((snapshot) => {
        return snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            nome: data['nome'],
            cnpj: data['cnpj'],
            createdAt: data['createdAt']?.toDate(),
            updatedAt: data['updatedAt']?.toDate(),
          } as Fazenda;
        });
      })
    );
  }

  /**
   * Cadastrar uma nova fazenda
   */
  cadastrarFazenda(
    fazenda: Omit<Fazenda, 'id' | 'createdAt' | 'updatedAt'>
  ): Observable<Fazenda> {
    const firestore = this.firebaseService.getFirestore();
    const fazendasRef = collection(firestore, this.FAZENDAS);
    const agora = Timestamp.now();

    const novaFazenda = {
      ...fazenda,
      createdAt: agora,
      updatedAt: agora,
    };

    return from(addDoc(fazendasRef, novaFazenda)).pipe(
      map((docRef) => {
        return {
          id: docRef.id,
          ...fazenda,
          createdAt: agora.toDate(),
          updatedAt: agora.toDate(),
        };
      })
    );
  }

  /**
   * Atualizar uma fazenda existente
   */
  atualizarFazenda(
    id: string,
    fazenda: Partial<Omit<Fazenda, 'id' | 'createdAt'>>
  ): Observable<void> {
    const firestore = this.firebaseService.getFirestore();
    const fazendaRef = doc(firestore, this.FAZENDAS, id);

    const dadosAtualizados = {
      ...fazenda,
      updatedAt: Timestamp.now(),
    };

    return from(updateDoc(fazendaRef, dadosAtualizados));
  }

  /**
   * Remover uma fazenda
   */
  removerFazenda(id: string): Observable<void> {
    const firestore = this.firebaseService.getFirestore();
    const fazendaRef = doc(firestore, this.FAZENDAS, id);

    return from(deleteDoc(fazendaRef));
  }

  /**
   * Obter uma fazenda pelo ID
   */
  obterFazendaPorId(id: string): Observable<Fazenda | null> {
    const firestore = this.firebaseService.getFirestore();
    const fazendaRef = doc(firestore, this.FAZENDAS, id);

    return from(getDoc(fazendaRef)).pipe(
      map((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            nome: data['nome'],
            cnpj: data['cnpj'],
            createdAt: data['createdAt']?.toDate(),
            updatedAt: data['updatedAt']?.toDate(),
          } as Fazenda;
        }
        return null;
      })
    );
  }
}
