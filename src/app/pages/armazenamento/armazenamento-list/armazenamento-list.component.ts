import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LocalArmazenamento } from '../../../core/models/armazenamento.model';
import { UnidadeMedida } from '../../../core/models/insumo.model';
import { Fazenda } from '../../../core/models/user.model';
import { ArmazenamentoService } from '../../../core/services/armazenamento.service';
import { FazendaService } from '../../../core/services/fazenda.service';

@Component({
  selector: 'app-armazenamento-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './armazenamento-list.component.html',
  styleUrls: ['./armazenamento-list.component.scss'],
})
export class ArmazenamentoListComponent implements OnInit {
  locaisArmazenamento: LocalArmazenamento[] = [];

  private fazendas: Fazenda[] = [];

  unidadesMedida = Object.values(UnidadeMedida);

  isLoading = false;
  modoEdicao = false;
  mostrarFormulario = false;

  error = '';

  armazenamentoForm: FormGroup;

  localEmEdicaoId: string = null;

  constructor(
    private armazenamentoService: ArmazenamentoService,
    private fazendaService: FazendaService,
    private fb: FormBuilder
  ) {
    this.armazenamentoForm = this.fb.group({
      nome: ['', [Validators.required]],
      tipoArmazenamento: ['', [Validators.required]],
      capacidadeMaxima: [0, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.carregarLocaisArmazenamento();
    this.carregarFazendas();
  }

  carregarFazendas(): void {
    this.fazendaService.obterFazendas().subscribe({
      next: (fazendas) => {
        this.fazendas = fazendas;
      },
      error: (err) => {
        console.error('Erro ao carregar fazendas:', err);
      },
    });
  }

  carregarLocaisArmazenamento(): void {
    this.isLoading = true;
    this.error = '';

    this.armazenamentoService.obterLocaisArmazenamento().subscribe({
      next: (locais) => {
        this.locaisArmazenamento = locais;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar locais de armazenamento:', err);
        this.error =
          'Não foi possível carregar os locais de armazenamento. Tente novamente mais tarde.';
        this.isLoading = false;
      },
    });
  }

  abrirFormulario(local?: LocalArmazenamento): void {
    if (local) {
      this.modoEdicao = true;
      this.localEmEdicaoId = local.id!;
      this.armazenamentoForm.patchValue({
        nome: local.nome,
        tipoArmazenamento: local.tipoArmazenamento,
        capacidadeMaxima: local.capacidadeMaxima,
      });
    } else {
      this.modoEdicao = false;
      this.localEmEdicaoId = null;
      this.armazenamentoForm.reset({
        tipoArmazenamento: this.unidadesMedida[0],
        capacidadeMaxima: 0,
      });
    }

    this.mostrarFormulario = true;
  }

  fecharFormulario(): void {
    this.mostrarFormulario = false;
    this.armazenamentoForm.reset();
  }

  salvarLocalArmazenamento(): void {
    if (this.armazenamentoForm.invalid) {
      this.armazenamentoForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.error = '';

    const formData = this.armazenamentoForm.value;

    const localData: Omit<
      LocalArmazenamento,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      nome: formData.nome,
      tipoArmazenamento: formData.tipoArmazenamento,
      capacidadeMaxima: formData.capacidadeMaxima,
      capacidadeUtilizada: this.modoEdicao
        ? this.locaisArmazenamento.find((l) => l.id === this.localEmEdicaoId)
            ?.capacidadeUtilizada || 0
        : 0,
    };

    if (this.modoEdicao && this.localEmEdicaoId) {
      this.armazenamentoService
        .atualizarLocalArmazenamento(this.localEmEdicaoId, localData)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.fecharFormulario();
            this.carregarLocaisArmazenamento();
          },
          error: (err) => {
            console.error('Erro ao atualizar local de armazenamento:', err);
            this.error =
              'Não foi possível atualizar o local de armazenamento. Tente novamente mais tarde.';
            this.isLoading = false;
          },
        });
    } else {
      this.armazenamentoService
        .cadastrarLocalArmazenamento(localData)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.fecharFormulario();
            this.carregarLocaisArmazenamento();
          },
          error: (err) => {
            console.error('Erro ao cadastrar local de armazenamento:', err);
            this.error =
              'Não foi possível cadastrar o local de armazenamento. Tente novamente mais tarde.';
            this.isLoading = false;
          },
        });
    }
  }

  removerLocalArmazenamento(id: string): void {
    if (
      confirm('Tem certeza que deseja remover este local de armazenamento?')
    ) {
      this.isLoading = true;
      this.error = '';

      this.armazenamentoService.removerLocalArmazenamento(id).subscribe({
        next: () => {
          this.isLoading = false;
          this.carregarLocaisArmazenamento();
        },
        error: (err) => {
          console.error('Erro ao remover local de armazenamento:', err);
          this.error =
            'Não foi possível remover o local de armazenamento. Tente novamente mais tarde.';
          this.isLoading = false;
        },
      });
    }
  }

  getFazendaNome(fazendaId?: string): string {
    if (!fazendaId) {
      return 'Local não utilizado';
    }

    return (
      this.fazendas.find((f) => f.id === fazendaId)?.nome ||
      'Fazenda não encontrada'
    );
  }

  getPercentualOcupacao(local: LocalArmazenamento): number {
    return (local.capacidadeUtilizada / local.capacidadeMaxima) * 100;
  }

  getClasseOcupacao(local: LocalArmazenamento): string {
    const percentual = this.getPercentualOcupacao(local);
    if (percentual < 50) {
      return 'bg-success';
    } else if (percentual < 80) {
      return 'bg-warning';
    } else {
      return 'bg-danger';
    }
  }
}
