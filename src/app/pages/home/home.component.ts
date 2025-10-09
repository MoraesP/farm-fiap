import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import { LocalArmazenamento } from '../../core/models/armazenamento.model';
import { CompraInsumo } from '../../core/models/insumo.model';
import { Plantacao } from '../../core/models/plantacao.model';
import { Perfil } from '../../core/models/user.model';
import { ArmazenamentoService } from '../../core/services/armazenamento.service';
import { InsumoService } from '../../core/services/insumo.service';
import { PlantacaoService } from '../../core/services/plantacao.service';
import { UserStateService } from '../../core/state/user-state.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('insumosChart') insumosChartRef!: ElementRef;
  @ViewChild('plantacaoChart') plantacaoChartRef!: ElementRef;
  @ViewChild('locaisChart') locaisChartRef!: ElementRef;

  carregandoInsumos = true;
  carregandoPlantacoes = true;
  carregandoLocais = true;

  mensagemErro = '';

  compras: CompraInsumo[] = [];
  plantacoes: Plantacao[] = [];
  locaisArmazenamento: LocalArmazenamento[] = [];

  insumosChart: Chart | null = null;
  plantacaoChart: Chart | null = null;
  locaisChart: Chart | null = null;

  constructor(
    private insumoService: InsumoService,
    private plantacaoService: PlantacaoService,
    private armazenamentoService: ArmazenamentoService,
    public userState: UserStateService
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.isCooperado) {
        this.carregarDados();
      }
    }, 100);
  }

  carregarDados(): void {
    const usuarioAtual = this.userState.usuarioAtual;

    if (!usuarioAtual || !usuarioAtual.fazenda) {
      this.mensagemErro =
        'Usuário não identificado ou não associado a uma fazenda.';
      return;
    }

    this.carregandoInsumos = true;
    this.insumoService.getComprasInsumoDaFazenda().subscribe({
      next: (compras) => {
        this.compras = compras;
        this.criarGraficoInsumos();
        this.carregandoInsumos = false;
      },
      error: () => {
        this.carregandoInsumos = false;
      },
    });

    this.carregandoPlantacoes = true;
    this.plantacaoService.getPlantacoes(usuarioAtual.fazenda!.id!).subscribe({
      next: (plantacoes) => {
        this.plantacoes = plantacoes;
        setTimeout(() => {
          this.criarGraficoPlantacao();
          this.carregandoPlantacoes = false;
        }, 0);
      },
      error: () => {
        this.carregandoPlantacoes = false;
      },
    });

    this.carregandoLocais = true;
    this.armazenamentoService.obterLocaisArmazenamento().subscribe({
      next: (locais) => {
        this.locaisArmazenamento = locais.filter(
          (local) => local.fazendaId === usuarioAtual.fazenda?.id
        );
        setTimeout(() => {
          this.criarGraficoLocais();
          this.carregandoLocais = false;
        }, 0);
      },
      error: () => {
        this.carregandoLocais = false;
      },
    });
  }

  private criarGraficoInsumos(): void {
    if (!this.insumosChartRef) {
      return;
    }

    try {
      const labels: string[] = [];
      const quantidadesCompradas: number[] = [];
      const quantidadesPlantadas: number[] = [];

      this.compras.forEach((compra) => {
        compra.itens.forEach((item) => {
          if (item.fazendaId === this.userState.usuarioAtual?.fazenda?.id) {
            labels.push(item.insumoNome);
            quantidadesCompradas.push(item.quantidadeComprada);
            quantidadesPlantadas.push(item.quantidadeUsada);
          }
        });
      });

      if (labels.length === 0) {
        return;
      }

      if (this.insumosChart) {
        this.insumosChart.destroy();
      }

      const canvas = this.insumosChartRef.nativeElement;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return;
      }

      this.insumosChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Quantidade Comprada',
              data: quantidadesCompradas,
              backgroundColor: 'rgba(54, 162, 235, 0.7)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
            {
              label: 'Quantidade Plantada',
              data: quantidadesPlantadas,
              backgroundColor: 'rgba(75, 192, 192, 0.7)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Meus Insumos - Comprados vs Plantados',
            },
            legend: {
              display: true,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    } catch (erro) {
      console.error('Erro ao criar gráfico de insumos:', erro);
    }
  }

  private criarGraficoPlantacao(): void {
    if (!this.plantacaoChartRef) {
      return;
    }

    try {
      const hoje = new Date();
      const labels: string[] = [];
      const diasPlantio: number[] = [];

      this.plantacoes.forEach((plantacao) => {
        if (!plantacao.colhida) {
          labels.push(plantacao.insumoNome);
          const dataPlantio = new Date(plantacao.dataPlantio);
          const diferencaEmDias = Math.floor(
            (hoje.getTime() - dataPlantio.getTime()) / (1000 * 60 * 60 * 24)
          );
          diasPlantio.push(diferencaEmDias);
        }
      });

      if (this.plantacaoChart) {
        this.plantacaoChart.destroy();
      }

      const ctx = this.plantacaoChartRef.nativeElement.getContext('2d');
      this.plantacaoChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Dias desde o plantio',
              data: diasPlantio,
              backgroundColor: 'rgba(153, 102, 255, 0.7)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Minha Plantação - Dias desde o Plantio',
            },
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Dias',
              },
            },
          },
        },
      });
    } catch (erro) {
      console.error('Erro ao criar gráfico de plantações:', erro);
    }
  }

  private criarGraficoLocais(): void {
    if (!this.locaisChartRef) {
      return;
    }

    try {
      const labels: string[] = [];
      const capacidadesMaximas: number[] = [];
      const capacidadesUtilizadas: number[] = [];

      this.locaisArmazenamento.forEach((local) => {
        labels.push(local.nome);
        capacidadesMaximas.push(local.capacidadeMaxima);
        capacidadesUtilizadas.push(local.capacidadeUtilizada);
      });

      if (this.locaisChart) {
        this.locaisChart.destroy();
      }

      const ctx = this.locaisChartRef.nativeElement.getContext('2d');
      this.locaisChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Capacidade Total',
              data: capacidadesMaximas,
              backgroundColor: 'rgba(255, 159, 64, 0.7)',
              borderColor: 'rgba(255, 159, 64, 1)',
              borderWidth: 1,
            },
            {
              label: 'Capacidade Utilizada',
              data: capacidadesUtilizadas,
              backgroundColor: 'rgba(255, 99, 132, 0.7)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Locais em Uso - Capacidade e Utilização',
            },
            legend: {
              display: true,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    } catch (erro) {
      console.error('Erro ao criar gráfico de locais:', erro);
    }
  }

  get isCooperado(): boolean {
    return this.userState.usuarioAtual?.perfil === Perfil.COOPERADO;
  }
}
