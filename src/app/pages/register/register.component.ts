import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  registerError = false;
  errorMessage = '';
  isLoading = false;

  private readonly IDADE_MINIMA = 18;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        cpf: ['', [Validators.required, this.cpfValidator()]],
        birthDate: ['', [Validators.required, this.birthDateValidator()]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.registerError = false;

      const { email, password, firstName, lastName, cpf, birthDate } =
        this.registerForm.value;

      this.authService
        .registerWithProfile(email, password, {
          firstName,
          lastName,
          cpf,
          birthDate,
        })
        .subscribe({
          next: (userProfile) => {
            this.isLoading = false;
            this.router.navigate(['/home']);
          },
          error: (error) => {
            this.isLoading = false;
            this.registerError = true;

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
      this.markFormGroupTouched(this.registerForm);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private passwordMatchValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    return password &&
      confirmPassword &&
      password.value !== confirmPassword.value
      ? { passwordMismatch: true }
      : null;
  };

  private cpfValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const cpf = control.value;

      if (!cpf) {
        return null;
      }

      const cpfClean = cpf.replace(/[^\d]/g, '');

      if (cpfClean.length !== 11) {
        return { invalidCpf: true };
      }

      if (/^(\d)\1{10}$/.test(cpfClean)) {
        return { invalidCpf: true };
      }

      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cpfClean.charAt(i)) * (10 - i);
      }

      let remainder = sum % 11;
      let digit1 = remainder < 2 ? 0 : 11 - remainder;

      if (parseInt(cpfClean.charAt(9)) !== digit1) {
        return { invalidCpf: true };
      }

      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cpfClean.charAt(i)) * (11 - i);
      }

      remainder = sum % 11;
      let digit2 = remainder < 2 ? 0 : 11 - remainder;

      if (parseInt(cpfClean.charAt(10)) !== digit2) {
        return { invalidCpf: true };
      }

      return null;
    };
  }

  private birthDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const birthDate = control.value;

      if (!birthDate) {
        return null;
      }

      const date = new Date(birthDate);
      const today = new Date();

      if (isNaN(date.getTime())) {
        return { invalidDate: true };
      }

      if (date > today) {
        return { futureDate: true };
      }

      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();

      if (
        age < this.IDADE_MINIMA ||
        (age === this.IDADE_MINIMA && monthDiff < 0) ||
        (age === this.IDADE_MINIMA &&
          monthDiff === 0 &&
          today.getDate() < date.getDate())
      ) {
        return { minAge: true };
      }

      return null;
    };
  }
}
