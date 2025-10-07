import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UserProfile } from '../../../core/models/user.model';

@Component({
  selector: 'app-complete-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './complete-profile-modal.component.html',
  styleUrls: ['./complete-profile-modal.component.scss'],
})
export class CompleteProfileModalComponent implements OnInit {
  @Input() show = false;
  @Input() usuario: Partial<UserProfile> | null = null;

  @Output() fecharEvent = new EventEmitter<void>();
  @Output() salvarEvent = new EventEmitter<{
    cpf: string;
    birthDate: string;
  }>();

  perfilForm: FormGroup;

  carregando = false;

  readonly IDADE_MINIMA = 18;

  constructor(private fb: FormBuilder) {
    this.perfilForm = this.fb.group({
      cpf: ['', [Validators.required, this.validarCPF()]],
      birthDate: ['', [Validators.required, this.validarDataDeNascimento()]],
    });
  }

  ngOnInit(): void {
    if (this.usuario) {
      if (this.usuario.cpf) {
        this.perfilForm.get('cpf')?.setValue(this.usuario.cpf);
      }
      if (this.usuario.birthDate) {
        this.perfilForm.get('birthDate')?.setValue(this.usuario.birthDate);
      }
    }
  }

  salvar(): void {
    if (this.perfilForm.valid) {
      this.carregando = true;
      const { cpf, birthDate } = this.perfilForm.value;

      this.salvarEvent.emit({ cpf, birthDate });
      this.carregando = false;
    } else {
      this.atualizarPerfilForm(this.perfilForm);
    }
  }

  fechar(): void {
    this.fecharEvent.emit();
  }

  private atualizarPerfilForm(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.atualizarPerfilForm(control);
      }
    });
  }

  private validarCPF(): ValidatorFn {
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

  private validarDataDeNascimento(): ValidatorFn {
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
