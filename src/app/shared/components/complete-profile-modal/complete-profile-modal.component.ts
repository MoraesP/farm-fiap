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
import {
  Fazenda,
  Perfil,
  PerfilUsuario,
} from '../../../core/models/user.model';
import { FazendaService } from '../../../core/services/fazenda.service';

@Component({
  selector: 'app-complete-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './complete-profile-modal.component.html',
  styleUrls: ['./complete-profile-modal.component.scss'],
})
export class CompleteProfileModalComponent implements OnInit {
  @Input() show = false;
  @Input() usuario: Partial<PerfilUsuario> | null = null;

  @Output() fecharEvent = new EventEmitter<void>();
  @Output() salvarEvent = new EventEmitter<{
    cpf: string;
    dataNascimento: string;
    perfil: Perfil;
    fazenda: Fazenda | null;
  }>();

  perfilForm: FormGroup;

  carregando = false;
  fazendas: Fazenda[] = [];
  perfis = Object.values(Perfil);

  readonly IDADE_MINIMA = 18;

  constructor(private fb: FormBuilder, private fazendaService: FazendaService) {
    this.perfilForm = this.fb.group({
      cpf: ['', [Validators.required, this.validarCPF()]],
      dataNascimento: [
        '',
        [Validators.required, this.validarDataDeNascimento()],
      ],
      perfil: [Perfil.COOPERADO, Validators.required],
      fazenda: [null],
    });
  }

  ngOnInit(): void {
    if (this.usuario) {
      if (this.usuario.cpf) {
        this.perfilForm.get('cpf')?.setValue(this.usuario.cpf);
      }
      if (this.usuario.dataNascimento) {
        this.perfilForm
          .get('dataNascimento')
          ?.setValue(this.usuario.dataNascimento);
      }
      if (this.usuario.perfil) {
        this.perfilForm.get('perfil')?.setValue(this.usuario.perfil);
      }
      if (this.usuario.fazenda) {
        this.perfilForm.get('fazenda')?.setValue(this.usuario.fazenda);
      }
    }

    this.carregarFazendas();
    this.onPerfilChange();
  }

  get eCooperado(): boolean {
    return this.perfilForm.get('perfil')?.value === Perfil.COOPERADO;
  }

  carregarFazendas(): void {
    this.fazendaService.obterTodasFazendas().subscribe({
      next: (fazendas) => {
        this.fazendas = fazendas;
      },
      error: (err) => {
        console.error('Erro ao carregar fazendas:', err);
      },
    });
  }

  onPerfilChange(): void {
    this.perfilForm.get('perfil')?.valueChanges.subscribe((perfil) => {
      const fazendaControl = this.perfilForm.get('fazenda');
      if (perfil === Perfil.COOPERADO) {
        fazendaControl?.setValidators([Validators.required]);
      } else {
        fazendaControl?.clearValidators();
        fazendaControl?.setValue(null);
      }
      fazendaControl?.updateValueAndValidity();
    });
  }

  salvar(): void {
    if (this.perfilForm.valid) {
      this.carregando = true;
      const { cpf, dataNascimento, perfil, fazenda } = this.perfilForm.value;

      const dadosPerfil = {
        cpf,
        dataNascimento,
        perfil,
        fazenda: perfil === Perfil.COOPERADO ? fazenda : null,
      };

      this.salvarEvent.emit(dadosPerfil);
      this.carregando = false;
    } else {
      this.atualizarPerfilForm(this.perfilForm);
    }
  }

  fechar(): void {
    this.fecharEvent.emit();
  }

  getPerfilNome = (perfil: Perfil) => {
    switch (perfil) {
      case Perfil.COOPERADO:
        return 'Cooperado';
      case Perfil.COOPERATIVA:
        return 'Cooperativa';
      default:
        return 'Sem Perfil';
    }
  };

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
}
