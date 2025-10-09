import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Perfil } from '../models/user.model';
import { UserStateService } from '../state/user-state.service';
import { FirebaseService } from './firebase.service';

export interface Notificacao {
  id?: string;
  titulo: string;
  mensagem: string;
  data: Date;
  lida: boolean;
  tipo: TipoNotificacao;
  destinatarioId?: string;
  remetenteFazendaId?: string;
  remetenteFazendaNome?: string;
  dadosAdicionais?: any;
}

export enum TipoNotificacao {
  LOCAL_DISPONIVEL = 'LOCAL_DISPONIVEL',
  NOVA_VENDA = 'NOVA_VENDA',
  SISTEMA = 'SISTEMA',
}

@Injectable({
  providedIn: 'root',
})
export class NotificacaoService {
  private notificacoesSubject = new BehaviorSubject<Notificacao[]>([]);
  notificacoes$ = this.notificacoesSubject.asObservable();

  private naoLidasSubject = new BehaviorSubject<number>(0);
  naoLidas$ = this.naoLidasSubject.asObservable();

  private readonly USUARIOS = 'users';
  private readonly NOTIFICACOES = 'notificacoes';

  constructor(
    private userState: UserStateService,
    private firebaseService: FirebaseService
  ) {
    this.inicializarNotificacoes();

    this.userState.usuarioAtual$.subscribe((usuario) => {
      if (usuario) {
        this.carregarNotificacoes().subscribe();
      } else {
        this.notificacoesSubject.next([]);
        this.naoLidasSubject.next(0);
      }
    });
  }

  private inicializarNotificacoes(): void {
    const usuarioAtual = this.userState.usuarioAtual;
    if (usuarioAtual && usuarioAtual.uid) {
      this.carregarNotificacoes().subscribe();
    }
  }

  private carregarNotificacoes(): Observable<Notificacao[]> {
    const usuarioAtual = this.userState.usuarioAtual;

    if (!usuarioAtual || !usuarioAtual.uid) {
      return of([]);
    }

    const firestore = this.firebaseService.getFirestore();
    const notificacoesRef = collection(firestore, this.NOTIFICACOES);

    return new Observable<Notificacao[]>((observer) => {
      const q = query(
        notificacoesRef,
        where('destinatarioId', '==', usuarioAtual.uid),
        orderBy('data', 'desc'),
        limit(20)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notificacoes = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              data: data['data']?.toDate() || new Date(),
            } as Notificacao;
          });

          this.notificacoesSubject.next(notificacoes);
          this.atualizarContadorNaoLidas(notificacoes);
          observer.next(notificacoes);
        },
        (error) => {
          console.error('Erro ao carregar notificações:', error);
          observer.error(error);
        }
      );

      return { unsubscribe };
    });
  }

  private atualizarContadorNaoLidas(notificacoes: Notificacao[]): void {
    const naoLidas = notificacoes.filter((n) => !n.lida).length;
    this.naoLidasSubject.next(naoLidas);
  }

  marcarComoLida(notificacaoId: string): Promise<void> {
    const usuarioAtual = this.userState.usuarioAtual;

    if (!usuarioAtual || !usuarioAtual.uid) {
      return Promise.reject('Usuário não autenticado');
    }

    const firestore = this.firebaseService.getFirestore();
    const notificacaoRef = doc(firestore, this.NOTIFICACOES, notificacaoId);

    return updateDoc(notificacaoRef, {
      lida: true,
      updatedAt: serverTimestamp(),
    });
  }

  marcarTodasComoLidas(): Promise<void> {
    const usuarioAtual = this.userState.usuarioAtual;

    if (!usuarioAtual || !usuarioAtual.uid) {
      return Promise.reject('Usuário não autenticado');
    }

    const firestore = this.firebaseService.getFirestore();
    const notificacoesRef = collection(firestore, this.NOTIFICACOES);

    const q = query(
      notificacoesRef,
      where('destinatarioId', '==', usuarioAtual.uid),
      where('lida', '==', false)
    );

    return getDocs(q).then((snapshot) => {
      const promises = snapshot.docs.map((doc) => {
        const notificacaoRef = doc.ref;
        return updateDoc(notificacaoRef, {
          lida: true,
          updatedAt: serverTimestamp(),
        });
      });

      return Promise.all(promises).then(() => {});
    });
  }

  notificarLocalDisponivel(
    localId: string,
    localNome: string,
    produtoNome: string
  ): Promise<void> {
    const usuarioAtual = this.userState.usuarioAtual;

    if (!usuarioAtual || !usuarioAtual.fazenda) {
      return Promise.reject('Usuário não associado a uma fazenda');
    }

    const firestore = this.firebaseService.getFirestore();
    const usuariosRef = collection(firestore, this.USUARIOS);

    const q = query(
      usuariosRef,
      where('perfil', '==', Perfil.COOPERADO),
      where('uid', '!=', usuarioAtual.uid)
    );

    return getDocs(q).then((snapshot) => {
      const promises = snapshot.docs.map((doc) => {
        const data = doc.data();
        const cooperadoId = data['uid'];
        const notificacoesRef = collection(firestore, this.NOTIFICACOES);

        return addDoc(notificacoesRef, {
          titulo: 'Local de Armazenamento Disponível',
          mensagem: `O local ${localNome} que armazenava ${produtoNome} está agora disponível.`,
          data: serverTimestamp(),
          lida: false,
          tipo: TipoNotificacao.LOCAL_DISPONIVEL,
          destinatarioId: cooperadoId,
          remetenteFazendaId: usuarioAtual.fazenda!.id,
          remetenteFazendaNome: usuarioAtual.fazenda!.nome,
          dadosAdicionais: {
            localId,
            localNome,
            produtoNome,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      return Promise.all(promises).then(() => {});
    });
  }
}
