import { Injectable } from '@angular/core';
import { doc, setDoc } from 'firebase/firestore';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Fazenda, Perfil, PerfilUsuario } from '../models/user.model';
import { FirebaseService } from '../services/firebase.service';

@Injectable({
  providedIn: 'root',
})
export class UserStateService {
  private usuarioAtualSubject = new BehaviorSubject<PerfilUsuario | null>(null);
  private precisaAtualizarPerfilSubject = new BehaviorSubject<boolean>(false);
  private usuarioPerfilGoogle: PerfilUsuario | null = null;

  public usuarioAtual$ = this.usuarioAtualSubject.asObservable();

  public precisaAtualizarPerfil$ =
    this.precisaAtualizarPerfilSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    const usuarioSalvo = localStorage.getItem('currentUser');
    if (usuarioSalvo) {
      const usuario = JSON.parse(usuarioSalvo) as PerfilUsuario;
      if (this.estaComPerfilCompleto(usuario)) {
        this.usuarioAtualSubject.next(usuario);
      }
    }
  }

  definirUsuarioAutenticado(usuario: PerfilUsuario): void {
    this.usuarioAtualSubject.next(usuario);
    localStorage.setItem('currentUser', JSON.stringify(usuario));
    this.precisaAtualizarPerfilSubject.next(false);
    this.usuarioPerfilGoogle = null;
  }

  comecarCompletandoPerfil(usuario: PerfilUsuario): void {
    this.usuarioPerfilGoogle = usuario;
    this.precisaAtualizarPerfilSubject.next(true);
    this.usuarioAtualSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  limparDadosUsuario(): void {
    this.usuarioAtualSubject.next(null);
    localStorage.removeItem('currentUser');
    this.precisaAtualizarPerfilSubject.next(false);
    this.usuarioPerfilGoogle = null;
  }

  cancelarAtualizacaoPerfil(): void {
    this.usuarioPerfilGoogle = null;
    this.precisaAtualizarPerfilSubject.next(false);
  }

  completarPerfilUsuario(perfilData: {
    cpf: string;
    dataNascimento: string;
    perfil: Perfil;
    fazenda: Fazenda | null;
  }): Observable<PerfilUsuario> {
    if (!this.usuarioPerfilGoogle) {
      throw new Error('Nenhum usuário temporário para completar o perfil.');
    }

    const firestore = this.firebaseService.getFirestore();
    const userDocRef = doc(firestore, 'users', this.usuarioPerfilGoogle.uid);

    const updatedProfile: PerfilUsuario = {
      ...this.usuarioPerfilGoogle,
      ...perfilData,
      updatedAt: new Date(),
    };

    return from(setDoc(userDocRef, updatedProfile, { merge: true })).pipe(
      map(() => {
        this.definirUsuarioAutenticado(updatedProfile);
        return updatedProfile;
      })
    );
  }

  estaComPerfilCompleto(perfilUsuario: PerfilUsuario | null): boolean {
    if (!perfilUsuario) {
      return false;
    }
    return !!(perfilUsuario.cpf && perfilUsuario.dataNascimento);
  }

  get usuarioAtual(): PerfilUsuario | null {
    return this.usuarioAtualSubject.value;
  }

  get usuarioGoogle(): PerfilUsuario | null {
    return this.usuarioPerfilGoogle;
  }

  get nomeUsuario(): string {
    if (!this.usuarioAtual) {
      return '';
    }
    return (
      `${this.usuarioAtual.primeiroNome} ${this.usuarioAtual.ultimoNome}`.trim() ||
      this.usuarioAtual.email
    );
  }

  get estaLogado(): boolean {
    return !!this.usuarioAtualSubject.value;
  }
}
