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
import { ArmazenamentoService } from '../../core/services/armazenamento.service';
import { ColheitaService } from '../../core/services/colheita.service';
import { PlantacaoService } from '../../core/services/plantacao.service';
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
  carregando = true;
  mensagemErro = '';

  // Dados para colheita
  mostrarModalColheita = false;
  plantacaoSelecionada: Plantacao | null = null;
  colheitaForm: FormGroup;
  locaisArmazenamento: LocalArmazenamento[] = [];
  locaisFiltrados: LocalArmazenamento[] = [];
  unidadesMedida = Object.values(UnidadeMedida);
  isLoadingColheita = false;

  constructor(
    private plantacaoService: PlantacaoService,
    private userState: UserStateService,
    private fb: FormBuilder,
    private armazenamentoService: ArmazenamentoService,
    private colheitaService: ColheitaService
  ) {
    this.colheitaForm = this.fb.group({
      nomeProduto: ['', [Validators.required]],
      tipoProduto: ['', [Validators.required]],
      quantidade: [0, [Validators.required, Validators.min(1)]],
      localArmazenamentoId: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.carregarPlantacoes();
    this.carregarLocaisArmazenamento();

    // Observar mudanças no tipo de produto para filtrar locais compatíveis
    this.colheitaForm.get('tipoProduto')?.valueChanges.subscribe((tipo) => {
      this.filtrarLocaisArmazenamento(tipo);
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

  filtrarLocaisArmazenamento(tipo: UnidadeMedida): void {
    if (!tipo) {
      this.locaisFiltrados = [];
      return;
    }

    const usuarioAtual = this.userState.usuarioAtual;
    if (!usuarioAtual || !usuarioAtual.fazenda) {
      return;
    }

    // Filtrar locais que são do mesmo tipo do produto e que:
    // 1. Não têm fazenda associada, ou
    // 2. Estão associados à mesma fazenda do usuário
    this.locaisFiltrados = this.locaisArmazenamento.filter((local) => {
      const mesmoTipo = local.tipoArmazenamento === tipo;
      const semFazenda = !local.fazendaId;
      const mesmaFazenda = local.fazendaId === usuarioAtual.fazenda?.id;
      const temEspaco = local.capacidadeUtilizada < local.capacidadeMaxima;

      return mesmoTipo && temEspaco && (semFazenda || mesmaFazenda);
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
      nomeProduto: '',
      tipoProduto: '',
      quantidade: 0,
      localArmazenamentoId: '',
    });
    this.mostrarModalColheita = true;
  }

  fecharModalColheita(): void {
    this.mostrarModalColheita = false;
    this.plantacaoSelecionada = null;
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

    // Verificar se há espaço suficiente
    if (
      localSelecionado.capacidadeUtilizada + formData.quantidade >
      localSelecionado.capacidadeMaxima
    ) {
      this.mensagemErro =
        'Capacidade máxima do local de armazenamento excedida.';
      this.isLoadingColheita = false;
      return;
    }

    const produtoColhido: Omit<
      ProdutoColhido,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      nome: formData.nomeProduto,
      tipo: formData.tipoProduto,
      quantidade: formData.quantidade,
      plantacaoId: this.plantacaoSelecionada.id!,
      plantacaoNome: this.plantacaoSelecionada.insumoNome,
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
          // Recarregar dados
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
