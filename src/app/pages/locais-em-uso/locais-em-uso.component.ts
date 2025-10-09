import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LocalArmazenamento } from '../../core/models/armazenamento.model';
import { RegiaoVenda, Venda } from '../../core/models/venda.model';
import { ArmazenamentoService } from '../../core/services/armazenamento.service';
import { ProdutoService } from '../../core/services/produto.service';
import { VendaService } from '../../core/services/venda.service';
import { UserStateService } from '../../core/state/user-state.service';
import {
  FirebaseTimestamp,
  formatarData,
} from '../../core/utils/date-firebase';

@Component({
  selector: 'app-locais-em-uso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './locais-em-uso.component.html',
  styleUrls: ['./locais-em-uso.component.scss'],
})
export class LocaisEmUsoComponent implements OnInit {
  locaisArmazenamento: LocalArmazenamento[] = [];
  carregando = true;
  mensagemErro = '';

  mostrarModalVenda = false;
  localSelecionado: LocalArmazenamento | null = null;
  produtoNome = '';
  vendaForm: FormGroup;
  isLoading = false;
  regioes = Object.values(RegiaoVenda);

  constructor(
    private armazenamentoService: ArmazenamentoService,
    private userState: UserStateService,
    private produtoService: ProdutoService,
    private vendaService: VendaService,
    private fb: FormBuilder
  ) {
    this.vendaForm = this.fb.group({
      quantidade: [1, [Validators.required, Validators.min(1)]],
      regiao: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.carregarLocaisEmUso();
  }

  carregarLocaisEmUso(): void {
    this.carregando = true;
    const usuarioAtual = this.userState.usuarioAtual;

    if (!usuarioAtual || !usuarioAtual.fazenda) {
      this.mensagemErro = 'Usuário não está associado a uma fazenda.';
      this.carregando = false;
      return;
    }

    this.armazenamentoService.obterLocaisArmazenamento().subscribe({
      next: (locais) => {
        this.locaisArmazenamento = locais.filter(
          (local) =>
            local.fazendaId === usuarioAtual.fazenda?.id &&
            local.capacidadeUtilizada > 0
        );
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar locais de armazenamento:', err);
        this.mensagemErro =
          'Erro ao carregar locais de armazenamento. Tente novamente.';
        this.carregando = false;
      },
    });
  }

  formatarData(data?: Date | FirebaseTimestamp): string {
    if (!data) {
      return 'Sem data';
    }
    return formatarData(data);
  }

  calcularPorcentagemUtilizada(local: LocalArmazenamento): number {
    return (local.capacidadeUtilizada / local.capacidadeMaxima) * 100;
  }

  obterClasseProgresso(porcentagem: number): string {
    if (porcentagem < 50) {
      return 'bg-success';
    } else if (porcentagem < 75) {
      return 'bg-warning';
    } else {
      return 'bg-danger';
    }
  }

  abrirModalVenda(local: LocalArmazenamento): void {
    this.localSelecionado = local;

    if (local.produtoId) {
      this.produtoService.getProduto(local.produtoId).subscribe({
        next: (produto) => {
          if (produto) {
            this.produtoNome = produto.nome;
          } else {
            this.produtoNome = 'Produto não encontrado';
          }
        },
        error: (err) => {
          console.error('Erro ao buscar produto:', err);
          this.produtoNome = 'Erro ao buscar produto';
        },
      });
    }

    this.vendaForm.reset({
      quantidade: 1,
      regiao: null,
    });

    this.vendaForm
      .get('quantidade')
      ?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(local.capacidadeUtilizada),
      ]);
    this.vendaForm.get('quantidade')?.updateValueAndValidity();

    this.mostrarModalVenda = true;
  }

  fecharModalVenda(): void {
    this.mostrarModalVenda = false;
    this.localSelecionado = null;
    this.produtoNome = '';
  }

  confirmarVenda(): void {
    if (this.vendaForm.invalid || !this.localSelecionado) {
      this.vendaForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.mensagemErro = '';

    const formData = this.vendaForm.value;
    const local = this.localSelecionado;

    if (!local.produtoId || !local.fazendaId) {
      this.mensagemErro = 'Dados do produto ou fazenda não encontrados.';
      this.isLoading = false;
      return;
    }

    const usuarioAtual = this.userState.usuarioAtual;
    if (!usuarioAtual || !usuarioAtual.fazenda) {
      this.mensagemErro = 'Usuário não está associado a uma fazenda.';
      this.isLoading = false;
      return;
    }

    const venda: Omit<Venda, 'id' | 'createdAt' | 'updatedAt'> = {
      produtoId: local.produtoId,
      produtoNome: this.produtoNome,
      quantidade: formData.quantidade,
      regiao: formData.regiao,
      localArmazenamentoId: local.id!,
      fazendaId: local.fazendaId,
      fazendaNome: local.fazendaNome || usuarioAtual.fazenda.nome,
      dataVenda: new Date(),
    };

    this.vendaService.registrarVenda(venda, local).subscribe({
      next: () => {
        this.isLoading = false;
        this.fecharModalVenda();
        this.carregarLocaisEmUso();
      },
      error: (err) => {
        console.error('Erro ao registrar venda:', err);
        this.mensagemErro =
          'Não foi possível registrar a venda. Tente novamente mais tarde.';
        this.isLoading = false;
      },
    });
  }
}
