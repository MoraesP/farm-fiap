import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;

  errorMessage = '';
  loginError = false;

  carregandoLogin = false;
  carregandoRegistro = false;
  carregandoGoogle = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.carregandoLogin = true;
      this.loginError = false;

      this.authService.login(email, password).subscribe({
        next: (user) => {
          this.carregandoLogin = false;
          if (user.email) {
            this.router.navigate(['/home']);
          } else {
            this.loginError = true;
            this.errorMessage =
              'Falha na autenticação. Verifique suas credenciais.';
          }
        },
        error: (error) => {
          this.carregandoLogin = false;
          this.loginError = true;

          if (error instanceof FirebaseError) {
            switch (error.code) {
              case 'auth/user-not-found':
                this.errorMessage = 'Usuário não encontrado.';
                break;
              case 'auth/wrong-password':
                this.errorMessage = 'Senha incorreta.';
                break;
              case 'auth/invalid-credential':
                this.errorMessage = 'Credenciais inválidas.';
                break;
              case 'auth/too-many-requests':
                this.errorMessage =
                  'Muitas tentativas. Tente novamente mais tarde.';
                break;
              default:
                this.errorMessage = `Erro de autenticação: ${error.message}`;
            }
          } else {
            this.errorMessage =
              'Ocorreu um erro durante o login. Tente novamente.';
          }
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  loginWithGoogle(): void {
    this.carregandoGoogle = true;
    this.loginError = false;

    this.authService.loginWithGoogle().subscribe({
      next: (user) => {
        this.carregandoGoogle = false;
        if (user.email) {
          this.router.navigate(['/home']);
        } else {
          this.loginError = true;
          this.errorMessage = 'Falha na autenticação com Google.';
        }
      },
      error: (error) => {
        this.carregandoGoogle = false;
        this.loginError = true;

        if (error instanceof FirebaseError) {
          switch (error.code) {
            case 'auth/popup-closed-by-user':
              this.errorMessage = 'Login cancelado. A janela foi fechada.';
              break;
            case 'auth/popup-blocked':
              this.errorMessage =
                'O popup de login foi bloqueado pelo navegador.';
              break;
            case 'auth/cancelled-popup-request':
              this.errorMessage =
                'Operação cancelada. Múltiplas solicitações de popup.';
              break;
            case 'auth/account-exists-with-different-credential':
              this.errorMessage =
                'Uma conta já existe com o mesmo email, mas credenciais diferentes.';
              break;
            default:
              this.errorMessage = `Erro de autenticação com Google: ${error.message}`;
          }
        } else {
          this.errorMessage =
            'Ocorreu um erro durante o login com Google. Tente novamente.';
        }
      },
    });
  }

  register(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.carregandoRegistro = true;
      this.loginError = false;

      this.authService.register(email, password).subscribe({
        next: (user) => {
          this.carregandoRegistro = false;
          if (user.email) {
            this.router.navigate(['/home']);
          } else {
            this.loginError = true;
            this.errorMessage = 'Falha no registro. Tente novamente.';
          }
        },
        error: (error) => {
          this.carregandoRegistro = false;
          this.loginError = true;

          if (error instanceof FirebaseError) {
            switch (error.code) {
              case 'auth/email-already-in-use':
                this.errorMessage = 'Este email já está em uso.';
                break;
              case 'auth/invalid-email':
                this.errorMessage = 'Email inválido.';
                break;
              case 'auth/weak-password':
                this.errorMessage =
                  'Senha muito fraca. Use pelo menos 6 caracteres.';
                break;
              default:
                this.errorMessage = `Erro no registro: ${error.message}`;
            }
          } else {
            this.errorMessage =
              'Ocorreu um erro durante o registro. Tente novamente.';
          }
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  get desabilitado() {
    return this.carregandoLogin || this.carregandoRegistro || this.carregandoGoogle;
  }
}
