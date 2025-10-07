import { Injectable } from '@angular/core';
import { doc, setDoc } from 'firebase/firestore';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserProfile } from '../models/user.model';
import { FirebaseService } from '../services/firebase.service';

@Injectable({
  providedIn: 'root',
})
export class UserStateService {
  private usuarioAtualSubject = new BehaviorSubject<UserProfile | null>(null);
  private precisaAtualizarPerfilSubject = new BehaviorSubject<boolean>(false);
  private usuarioPerfilGoogle: UserProfile | null = null;

  public usuarioAtual$ = this.usuarioAtualSubject.asObservable();

  public precisaAtualizarPerfil$ =
    this.precisaAtualizarPerfilSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    const usuarioSalvo = localStorage.getItem('currentUser');
    if (usuarioSalvo) {
      const user = JSON.parse(usuarioSalvo) as UserProfile;
      if (this.estaComPerfilCompleto(user)) {
        this.usuarioAtualSubject.next(user);
      }
    }
  }

  definirUsuarioAutenticado(user: UserProfile): void {
    this.usuarioAtualSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.precisaAtualizarPerfilSubject.next(false);
    this.usuarioPerfilGoogle = null;
  }

  comecarCompletandoPerfil(user: UserProfile): void {
    this.usuarioPerfilGoogle = user;
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

  completarPerfilUsuario(profileData: {
    cpf: string;
    birthDate: string;
  }): Observable<UserProfile> {
    if (!this.usuarioPerfilGoogle) {
      throw new Error('Nenhum usuário temporário para completar o perfil.');
    }

    const firestore = this.firebaseService.getFirestore();
    const userDocRef = doc(firestore, 'users', this.usuarioPerfilGoogle.uid);

    const updatedProfile: UserProfile = {
      ...this.usuarioPerfilGoogle,
      ...profileData,
      updatedAt: new Date(),
    };

    return from(setDoc(userDocRef, updatedProfile, { merge: true })).pipe(
      map(() => {
        this.definirUsuarioAutenticado(updatedProfile);
        return updatedProfile;
      })
    );
  }

  estaComPerfilCompleto(profile: UserProfile | null): boolean {
    if (!profile) {
      return false;
    }
    return !!(profile.cpf && profile.birthDate);
  }

  get usuarioAtual(): UserProfile | null {
    return this.usuarioAtualSubject.value;
  }

  get usuarioGoogle(): UserProfile | null {
    return this.usuarioPerfilGoogle;
  }

  get name(): string {
    const user = this.usuarioAtualSubject.value;
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }

  get estaLogado(): boolean {
    return !!this.usuarioAtualSubject.value;
  }
}
