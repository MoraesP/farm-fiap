import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { Observable, from, map, of, switchMap } from 'rxjs';
import { CompraInsumo, Insumo, StatusCompra } from '../models/insumo.model';
import { UserStateService } from '../state/user-state.service';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class InsumoService {
  private readonly INSUMOS = 'insumos';
  private readonly COMPRAS_INSUMOS = 'compras_insumos';

  constructor(
    private userState: UserStateService,
    private firebaseService: FirebaseService
  ) {}

  getInsumos(): Observable<Insumo[]> {
    const firestore = this.firebaseService.getFirestore();
    const insumosRef = collection(firestore, this.INSUMOS);

    // Implementação manual de collectionData usando onSnapshot
    return new Observable<Insumo[]>((observer) => {
      const unsubscribe = onSnapshot(
        insumosRef,
        (snapshot) => {
          const insumos = snapshot.docs.map((doc) => {
            return { id: doc.id, ...doc.data() } as Insumo;
          });
          observer.next(insumos);
        },
        (error) => {
          observer.error(error);
        }
      );

      // Retorna a função de limpeza para quando o Observable for cancelado
      return { unsubscribe };
    });
  }

  getInsumo(id: string): Observable<Insumo | null> {
    const firestore = this.firebaseService.getFirestore();
    const insumoDocRef = doc(firestore, this.INSUMOS, id);
    return from(getDoc(insumoDocRef)).pipe(
      map((docSnap) => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Insumo;
        }
        return null;
      })
    );
  }

  adicionarInsumo(
    insumo: Omit<Insumo, 'id' | 'createdAt' | 'updatedAt'>
  ): Observable<Insumo> {
    const firestore = this.firebaseService.getFirestore();
    const insumosRef = collection(firestore, this.INSUMOS);

    const novoInsumo: Omit<Insumo, 'id'> = {
      ...insumo,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return from(addDoc(insumosRef, novoInsumo)).pipe(
      map((docRef) => {
        return { id: docRef.id, ...novoInsumo } as Insumo;
      })
    );
  }

  atualizarInsumo(id: string, insumo: Partial<Insumo>): Observable<void> {
    const firestore = this.firebaseService.getFirestore();
    const insumoDocRef = doc(firestore, this.INSUMOS, id);

    const dadosAtualizados = {
      ...insumo,
      updatedAt: new Date(),
    };

    return from(updateDoc(insumoDocRef, dadosAtualizados));
  }

  removerInsumo(id: string): Observable<void> {
    const firestore = this.firebaseService.getFirestore();
    const insumoDocRef = doc(firestore, this.INSUMOS, id);
    return from(deleteDoc(insumoDocRef));
  }

  registrarCompraInsumo(
    compra: Omit<CompraInsumo, 'id' | 'dataCompra' | 'status'>
  ): Observable<CompraInsumo> {
    const firestore = this.firebaseService.getFirestore();
    const comprasRef = collection(firestore, this.COMPRAS_INSUMOS);

    const novaCompra: Omit<CompraInsumo, 'id'> = {
      ...compra,
      dataCompra: new Date(),
      status: StatusCompra.PENDENTE,
    };

    return from(addDoc(comprasRef, novaCompra)).pipe(
      switchMap((docRef) => {
        const atualizacoes = compra.itens.map((item) => {
          const insumoRef = doc(firestore, this.INSUMOS, item.insumoId);
          return updateDoc(insumoRef, {
            updatedAt: new Date(),
          });
        });
        return from(Promise.all(atualizacoes)).pipe(
          map(() => {
            return { id: docRef.id, ...novaCompra } as CompraInsumo;
          })
        );
      })
    );
  }

  getComprasInsumo(): Observable<CompraInsumo[]> {
    const firestore = this.firebaseService.getFirestore();
    const comprasRef = collection(firestore, this.COMPRAS_INSUMOS);

    // Implementação manual de collectionData usando onSnapshot
    return new Observable<CompraInsumo[]>((observer) => {
      const unsubscribe = onSnapshot(
        comprasRef,
        (snapshot) => {
          const compras = snapshot.docs.map((doc) => {
            return { id: doc.id, ...doc.data() } as CompraInsumo;
          });
          observer.next(compras);
        },
        (error) => {
          observer.error(error);
        }
      );

      // Retorna a função de limpeza para quando o Observable for cancelado
      return { unsubscribe };
    });
  }

  getComprasInsumoDoUsuario(): Observable<CompraInsumo[]> {
    const usuarioAtual = this.userState.usuarioAtual;
    if (!usuarioAtual) {
      return of([]);
    }

    const firestore = this.firebaseService.getFirestore();
    const comprasRef = collection(firestore, this.COMPRAS_INSUMOS);

    // Implementação manual usando onSnapshot
    return new Observable<CompraInsumo[]>((observer) => {
      const unsubscribe = onSnapshot(
        comprasRef,
        (snapshot) => {
          const compras = snapshot.docs
            .map((doc) => {
              return { id: doc.id, ...doc.data() } as CompraInsumo;
            })
            .filter((compra) => {
              return compra.itens.some(
                (item: any) => item.cooperadoUid === usuarioAtual.uid
              );
            });
          observer.next(compras);
        },
        (error) => {
          observer.error(error);
        }
      );

      // Retorna a função de limpeza para quando o Observable for cancelado
      return { unsubscribe };
    });
  }

  getComprasInsumoDaFazenda(): Observable<CompraInsumo[]> {
    const usuarioAtual = this.userState.usuarioAtual;
    if (!usuarioAtual) {
      return of([]);
    }

    const firestore = this.firebaseService.getFirestore();
    const comprasRef = collection(firestore, this.COMPRAS_INSUMOS);

    // Implementação manual usando onSnapshot
    return new Observable<CompraInsumo[]>((observer) => {
      const unsubscribe = onSnapshot(
        comprasRef,
        (snapshot) => {
          const compras = snapshot.docs
            .map((doc) => {
              return { id: doc.id, ...doc.data() } as CompraInsumo;
            })
            .filter((compra) => {
              return compra.itens.some(
                (item) => item.fazendaId === usuarioAtual.fazenda?.id
              );
            });
          observer.next(compras);
        },
        (error) => {
          observer.error(error);
        }
      );

      // Retorna a função de limpeza para quando o Observable for cancelado
      return { unsubscribe };
    });
  }
}
