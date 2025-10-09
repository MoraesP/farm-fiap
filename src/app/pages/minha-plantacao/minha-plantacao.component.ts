import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LocalArmazenamento } from '../../core/models/armazenamento.model';
import { ProdutoColhido } from '../../core/models/colheita.model';
import { UnidadeMedida } from '../../core/models/insumo.model';
import { Plantacao } from '../../core/models/plantacao.model';
import { Produto } from '../../core/models/produto.model';
import { ArmazenamentoService } from '../../core/services/armazenamento.service';
import { ColheitaService } from '../../core/services/colheita.service';
import { PlantacaoService } from '../../core/services/plantacao.service';
import { ProdutoService } from '../../core/services/produto.service';
import { UserStateService } from '../../core/state/user-state.service';
import {
  FirebaseTimestamp,
  formatarData,
} from '../../core/utils/date-firebase';

@Component({
  selector: 'app-minha-plantacao',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './minha-plantacao.component.html',
  styleUrls: ['./minha-plantacao.component.scss'],
})
export class MinhaPlantacaoComponent implements OnInit {
  plantacoes: Plantacao[] = [];

  mensagemErro = '';

  carregando = true;
  isLoadingColheita = false;
  mostrarModalColheita = false;
  carregandoProdutos = false;

  plantacaoSelecionada: Plantacao = null;

  colheitaForm: FormGroup;

  produtosDisponiveis: Produto[] = [];
  locaisFiltrados: LocalArmazenamento[] = [];
  locaisArmazenamento: LocalArmazenamento[] = [];

  unidadesMedida = Object.values(UnidadeMedida);

  constructor(
    private fb: FormBuilder,
    private userState: UserStateService,
    private produtoService: ProdutoService,
    private colheitaService: ColheitaService,
    private plantacaoService: PlantacaoService,
    private armazenamentoService: ArmazenamentoService
  ) {
    this.colheitaForm = this.fb.group({
      produtoId: ['', [Validators.required]],
      quantidade: [0, [Validators.required, Validators.min(1)]],
      localArmazenamentoId: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.carregarPlantacoes();
    this.carregarLocaisArmazenamento();

    this.colheitaForm.get('produtoId')?.valueChanges.subscribe((produtoId) => {
      if (produtoId) {
        const produtoSelecionado = this.produtosDisponiveis.find(
          (p) => p.id === produtoId
        );
        if (produtoSelecionado) {
          this.filtrarLocaisArmazenamento(produtoSelecionado.unidadeMedida, produtoId);
        }
      } else {
        this.locaisFiltrados = [];
      }
    });
  }

  carregarProdutosPorInsumo(insumoId: string): void {
    this.carregandoProdutos = true;
    this.produtosDisponiveis = [];

    this.produtoService.getProdutosPorInsumo(insumoId).subscribe({
      next: (produtos) => {
        this.produtosDisponiveis = produtos;
        this.carregandoProdutos = false;

        if (produtos.length === 0) {
          this.mensagemErro =
            'Não há produtos cadastrados para este insumo. Cadastre um produto primeiro.';
        }
      },
      error: (err) => {
        console.error('Erro ao carregar produtos:', err);
        this.mensagemErro = 'Erro ao carregar produtos relacionados ao insumo.';
        this.carregandoProdutos = false;
      },
    });
  }

  carregarPlantacoes(): void {
    const usuarioAtual = this.userState.usuarioAtual;
    if (!usuarioAtual) {
      this.carregando = false;
      return;
    }

    this.plantacaoService.getPlantacoes(usuarioAtual.fazenda?.id!).subscribe({
      next: (plantacoes) => {
        this.plantacoes = plantacoes;
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar plantações:', err);
        this.mensagemErro = 'Erro ao carregar plantações. Tente novamente.';
        this.carregando = false;
      },
    });
  }

  carregarLocaisArmazenamento(): void {
    this.armazenamentoService.obterLocaisArmazenamento().subscribe({
      next: (locais) => {
        this.locaisArmazenamento = locais;
      },
      error: (err) => {
        console.error('Erro ao carregar locais de armazenamento:', err);
      },
    });
  }

  filtrarLocaisArmazenamento(tipo: UnidadeMedida, produtoId: string): void {
    if (!tipo) {
      this.locaisFiltrados = [];
      return;
    }

    const usuarioAtual = this.userState.usuarioAtual;
    if (!usuarioAtual || !usuarioAtual.fazenda) {
      return;
    }

    this.locaisFiltrados = this.locaisArmazenamento.filter((local) => {
      const semFazenda = !local.fazendaId;
      const mesmaFazenda = local.fazendaId === usuarioAtual.fazenda?.id;
      const mesmoTipo = local.tipoArmazenamento === tipo;
      const temEspaco = local.capacidadeUtilizada < local.capacidadeMaxima;
      const semProduto = !local.produtoId;
      const mesmoProdutoJaArmazenado = produtoId
        ? local.produtoId === produtoId
        : false;

      return (
        mesmoTipo &&
        temEspaco &&
        (semFazenda || mesmaFazenda) &&
        (semProduto || mesmoProdutoJaArmazenado)
      );
    });
  }

  calcularTotalPlantado(): number {
    return this.plantacoes.reduce(
      (total, plantacao) => total + plantacao.quantidadePlantada,
      0
    );
  }

  formatarData(data?: Date | FirebaseTimestamp): string {
    if (!data) {
      return 'Ainda não foi feito a colheita';
    }
    return formatarData(data);
  }

  abrirModalColheita(plantacao: Plantacao): void {
    if (plantacao.colhida) {
      this.mensagemErro = 'Esta plantação já foi colhida.';
      return;
    }

    this.plantacaoSelecionada = plantacao;
    this.colheitaForm.reset({
      produtoId: '',
      quantidade: 0,
      localArmazenamentoId: '',
    });

    this.carregarProdutosPorInsumo(plantacao.insumoId);

    this.mostrarModalColheita = true;
  }

  fecharModalColheita(): void {
    this.mostrarModalColheita = false;
    this.plantacaoSelecionada = null;
    this.produtosDisponiveis = [];
  }

  colher(): void {
    if (this.colheitaForm.invalid || !this.plantacaoSelecionada) {
      this.colheitaForm.markAllAsTouched();
      return;
    }

    const usuarioAtual = this.userState.usuarioAtual;
    if (!usuarioAtual || !usuarioAtual.fazenda) {
      this.mensagemErro = 'Usuário não está associado a uma fazenda.';
      return;
    }

    this.isLoadingColheita = true;

    const formData = this.colheitaForm.value;
    const localSelecionado = this.locaisArmazenamento.find(
      (local) => local.id === formData.localArmazenamentoId
    );

    if (!localSelecionado) {
      this.mensagemErro = 'Local de armazenamento não encontrado.';
      this.isLoadingColheita = false;
      return;
    }

    if (
      localSelecionado.capacidadeUtilizada + formData.quantidade >
      localSelecionado.capacidadeMaxima
    ) {
      this.mensagemErro =
        'Capacidade máxima do local de armazenamento excedida.';
      this.isLoadingColheita = false;
      return;
    }

    const produtoSelecionado = this.produtosDisponiveis.find(
      (p) => p.id === formData.produtoId
    );

    if (!produtoSelecionado) {
      this.mensagemErro = 'Produto não encontrado.';
      this.isLoadingColheita = false;
      return;
    }

    const produtoColhido: Omit<
      ProdutoColhido,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      insumoId: this.plantacaoSelecionada.insumoId,
      produtoId: produtoSelecionado.id,
      produtoNome: produtoSelecionado.nome,
      produtoUnidadeMedida: produtoSelecionado.unidadeMedida,
      quantidade: formData.quantidade,
      plantacaoId: this.plantacaoSelecionada.id!,
      localArmazenamentoId: formData.localArmazenamentoId,
      localArmazenamentoNome: localSelecionado.nome,
      fazendaId: usuarioAtual.fazenda.id!,
      fazendaNome: usuarioAtual.fazenda.nome,
      dataColheita: new Date(),
    };

    this.colheitaService
      .registrarColheita(produtoColhido, localSelecionado)
      .subscribe({
        next: () => {
          this.isLoadingColheita = false;
          this.fecharModalColheita();
          this.carregarLocaisArmazenamento();
        },
        error: (err) => {
          console.error('Erro ao registrar colheita:', err);
          this.mensagemErro = 'Erro ao registrar colheita. Tente novamente.';
          this.isLoadingColheita = false;
        },
      });
  }
}
