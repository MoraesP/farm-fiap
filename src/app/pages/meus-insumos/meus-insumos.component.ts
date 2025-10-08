import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CompraInsumo } from '../../core/models/insumo.model';
import { InsumoService } from '../../core/services/insumo.service';
import { PlantacaoService } from '../../core/services/plantacao.service';
import { UserStateService } from '../../core/state/user-state.service';
import {
  FirebaseTimestamp,
  compararDatas,
  formatarData,
} from '../../core/utils/date-firebase';

interface InsumoComprado {
  id: string;
  nome: string;
  tipo: string;
  unidadeMedida: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  dataCompra: Date | FirebaseTimestamp;
}

@Component({
  selector: 'app-meus-insumos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './meus-insumos.component.html',
  styleUrls: ['./meus-insumos.component.scss'],
})
export class MeusInsumosComponent implements OnInit {
  insumosComprados: InsumoComprado[] = [];
  carregando = true;

  mensagemErro = '';
  mensagemSucesso = '';

  // Modal de plantio
  modalPlantarAberto = false;
  insumoSelecionado: InsumoComprado | null = null;
  plantarForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userState: UserStateService,
    private insumoService: InsumoService,
    private plantacaoService: PlantacaoService
  ) {
    this.plantarForm = this.criarFormularioPlantar();
  }

  ngOnInit(): void {
    this.carregarInsumosComprados();
  }

  criarFormularioPlantar(): FormGroup {
    return this.fb.group({
      quantidade: [
        1,
        [Validators.required, Validators.min(1), Validators.max(1)],
      ],
    });
  }

  carregarInsumosComprados(): void {
    this.carregando = true;
    this.insumoService.getComprasInsumoDoUsuario().subscribe({
      next: (compras) => {
        this.processarCompras(compras);
        this.carregando = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar insumos comprados:', erro);
        this.mensagemErro =
          'Erro ao carregar insumos comprados. Tente novamente mais tarde.';
        this.carregando = false;
      },
    });
  }

  processarCompras(compras: CompraInsumo[]): void {
    const usuarioAtual = this.userState.usuarioAtual;
    if (!usuarioAtual) {
      return;
    }

    this.insumosComprados = [];

    compras.forEach((compra) => {
      // Filtrar apenas os itens do usuário atual
      const itensDoUsuario = compra.itens.filter(
        (item) => item.cooperadoUid === usuarioAtual.uid
      );

      // Converter cada item em um InsumoComprado
      itensDoUsuario.forEach((item) => {
        this.insumosComprados.push({
          id: item.insumo.id!,
          nome: item.insumo.nome,
          tipo: item.insumo.tipo,
          unidadeMedida: item.insumo.unidadeMedida,
          quantidade: item.quantidade,
          valorUnitario: item.insumo.valorPorUnidade,
          valorTotal: item.valorTotal,
          dataCompra: compra.dataCompra,
        });
      });
    });

    // Ordenar por data de compra (mais recente primeiro)
    this.insumosComprados.sort((a, b) =>
      compararDatas(a.dataCompra, b.dataCompra)
    );
  }

  calcularTotalGasto(): number {
    return this.insumosComprados.reduce(
      (total, insumo) => total + insumo.valorTotal,
      0
    );
  }

  formatarData(data: Date | FirebaseTimestamp): string {
    return formatarData(data);
  }

  // Métodos para o modal de plantio
  abrirModalPlantar(insumo: InsumoComprado): void {
    this.insumoSelecionado = insumo;

    // Atualizar o validador de quantidade máxima
    this.plantarForm
      .get('quantidade')
      ?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(insumo.quantidade),
      ]);

    this.plantarForm.patchValue({
      quantidade: 1,
    });

    this.plantarForm.get('quantidade')?.updateValueAndValidity();
    this.modalPlantarAberto = true;
  }

  fecharModalPlantar(): void {
    this.modalPlantarAberto = false;
    this.insumoSelecionado = null;
  }

  confirmarPlantar(): void {
    if (this.plantarForm.invalid || !this.insumoSelecionado) {
      return;
    }

    const quantidadePlantar = this.plantarForm.get('quantidade')?.value;
    const usuarioAtual = this.userState.usuarioAtual;

    if (!usuarioAtual) {
      this.mensagemErro = 'Erro: Usuário não identificado.';
      return;
    }

    const itemInsumo = {
      insumo: {
        id: this.insumoSelecionado.id,
        nome: this.insumoSelecionado.nome,
        tipo: this.insumoSelecionado.tipo,
        unidadeMedida: this.insumoSelecionado.unidadeMedida,
        valorPorUnidade: this.insumoSelecionado.valorUnitario,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      quantidade: this.insumoSelecionado.quantidade,
      valorTotal: this.insumoSelecionado.valorTotal,
      cooperadoUid: usuarioAtual.uid,
      cooperadoNome: this.userState.nomeUsuario,
    };

    this.plantacaoService
      .registrarPlantacao(
        itemInsumo,
        quantidadePlantar,
        usuarioAtual.uid,
        this.userState.nomeUsuario
      )
      .subscribe({
        next: () => {
          const novaQuantidade =
            this.insumoSelecionado!.quantidade - quantidadePlantar;

          if (this.insumoSelecionado) {
            if (novaQuantidade <= 0) {
              const index = this.insumosComprados.findIndex(
                (i) => i === this.insumoSelecionado
              );

              if (index !== -1) {
                this.insumosComprados.splice(index, 1);
              }

              this.mensagemSucesso = `Todo o estoque de ${this.insumoSelecionado.nome} foi plantado com sucesso!`;
            } else {
              this.insumoSelecionado.quantidade = novaQuantidade;
              this.mensagemSucesso = `Plantio de ${quantidadePlantar} ${this.insumoSelecionado.unidadeMedida} de ${this.insumoSelecionado.nome} registrado com sucesso!`;
            }
          }

          this.fecharModalPlantar();
          setTimeout(() => {
            this.mensagemSucesso = '';
          }, 3000);
        },
        error: (erro) => {
          console.error('Erro ao registrar plantio:', erro);
          this.mensagemErro =
            'Erro ao registrar plantio. Tente novamente mais tarde.';
        },
      });
  }
}
