import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
import { Fazenda, Perfil } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { FazendaService } from '../../core/services/fazenda.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;

  errorMessage = '';

  isLoading = false;
  registerError = false;
  passwordVisible = false;
  confirmPasswordVisible = false;

  perfis = Object.values(Perfil);

  fazendas: Fazenda[] = [];

  private readonly IDADE_MINIMA = 18;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private fazendaService: FazendaService
  ) {
    this.registerForm = this.fb.group(
      {
        primeiroNome: ['', [Validators.required, Validators.minLength(2)]],
        ultimoNome: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        cpf: ['', [Validators.required, this.cpfValidator()]],
        dataNascimento: [
          '',
          [Validators.required, this.dataNascimentoValidator()],
        ],
        perfil: [Perfil.COOPERADO, Validators.required],
        fazenda: [null], // Começa nulo
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  ngOnInit(): void {
    this.onPerfilChange();
    this.carregarFazendas();
  }

  onPerfilChange(): void {
    this.registerForm.get('perfil')?.valueChanges.subscribe((perfil) => {
      const fazendaControl = this.registerForm.get('fazenda');
      if (perfil === Perfil.COOPERADO) {
        fazendaControl?.setValidators([Validators.required]);
      } else {
        fazendaControl?.clearValidators();
        fazendaControl?.setValue(null);
      }
      fazendaControl?.updateValueAndValidity();
      this.cdr.detectChanges(); // Forçar detecção de mudanças
    });
  }

  carregarFazendas(): void {
    this.fazendaService.obterTodasFazendas().subscribe({
      next: (fazendas) => {
        this.fazendas = fazendas;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar fazendas:', err);
      },
    });
  }

  get eCooperado(): boolean {
    return this.registerForm.get('perfil')?.value === Perfil.COOPERADO;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.registerError = false;

      const { email, password, ...profileData } = this.registerForm.value;
      delete profileData.confirmPassword; // Remover campo de confirmação

      // Limpar fazenda se não for cooperado
      if (profileData.perfil !== Perfil.COOPERADO) {
        // Remover completamente o campo fazenda para evitar valores undefined
        delete profileData.fazenda;
      } else if (profileData.fazenda === null) {
        // Garantir que não haja valores null para cooperados
        this.registerError = true;
        this.errorMessage = 'Por favor, selecione uma fazenda.';
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      }

      this.authService
        .registerWithProfile(email, password, profileData)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate(['/app']);
          },
          error: (error) => {
            this.isLoading = false;
            this.registerError = true;
            this.errorMessage = 'Erro ao registrar usuário. Tente novamente.';
            console.error('Erro no registro:', error);
            this.cdr.detectChanges();
          },
        });
    } else {
      this.markAllAsTouched(this.registerForm);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private markAllAsTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markAllAsTouched(control);
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

  private dataNascimentoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const dataNascimento = control.value;

      if (!dataNascimento) {
        return null;
      }

      const date = new Date(dataNascimento);
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

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.passwordVisible = !this.passwordVisible;
    } else {
      this.confirmPasswordVisible = !this.confirmPasswordVisible;
    }
  }

  getPerfilNome = (perfil: Perfil) => {
    switch (perfil) {
      case Perfil.COOPERADO:
        return 'Cooperado';

      case Perfil.COOPERATIVA:
        return 'Cooperativa';

      default:
        return 'Sem perfil';
    }
  };
}
