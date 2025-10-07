import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { Subscription } from 'rxjs';
import { UserProfile } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { UserStateService } from '../../core/state/user-state.service';
import { CompleteProfileModalComponent } from '../../shared/components/complete-profile-modal/complete-profile-modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CompleteProfileModalComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  errorMessage = '';
  loginError = false;

  carregandoLogin = false;
  carregandoGoogle = false;

  // Estado do modal
  showCompleteProfileModal = false;
  tempUserForModal: UserProfile | null = null;
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private userState: UserStateService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.userState.precisaAtualizarPerfil$.subscribe((completarPerfil) => {
        this.showCompleteProfileModal = completarPerfil;
        if (completarPerfil) {
          this.tempUserForModal = this.userState.usuarioGoogle;
        }
      })
    );

    this.subscriptions.add(
      this.userState.usuarioAtual$.subscribe((usuario) => {
        if (usuario && this.userState.estaComPerfilCompleto(usuario)) {
          this.router.navigate(['/home']);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.carregandoLogin = true;
    this.loginError = false;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      error: (error) => this.handleAuthError(error),
      complete: () => (this.carregandoLogin = false),
    });
  }

  loginWithGoogle(): void {
    this.carregandoGoogle = true;
    this.loginError = false;

    this.authService.loginWithGoogle().subscribe({
      error: (error) => this.handleAuthError(error),
      complete: () => (this.carregandoGoogle = false),
    });
  }

  handleCompleteProfile(profileData: { cpf: string; birthDate: string }): void {
    this.userState.completarPerfilUsuario(profileData).subscribe({
      error: (error) => this.handleAuthError(error),
    });
  }

  handleCloseModal(): void {
    this.userState.cancelarAtualizacaoPerfil();
    this.authService.logout().subscribe();
  }

  register(): void {
    this.router.navigate(['/register']);
  }

  get desabilitado(): boolean {
    return this.carregandoLogin || this.carregandoGoogle;
  }

  private handleAuthError(error: any): void {
    this.carregandoLogin = false;
    this.carregandoGoogle = false;
    this.loginError = true;

    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          this.errorMessage =
            'Credenciais inválidas. Verifique seu email e senha.';
          break;
        case 'auth/too-many-requests':
          this.errorMessage =
            'Muitas tentativas de login. Tente novamente mais tarde.';
          break;
        case 'auth/popup-closed-by-user':
          this.errorMessage = 'O processo de login com Google foi cancelado.';
          this.loginError = false; // Não é um erro crítico
          break;
        default:
          this.errorMessage = 'Ocorreu um erro inesperado. Tente novamente.';
      }
    } else {
      this.errorMessage = 'Ocorreu um erro de conexão. Verifique sua internet.';
    }
  }
}
