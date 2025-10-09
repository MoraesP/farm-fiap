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
  compraId: string;
  insumoId: string;
  nome: string;
  tipo: string;
  unidadeMedida: string;
  quantidadeComprada: number;
  quantidadeUsada: number;
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

  mensagemErro = '';
  mensagemSucesso = '';

  carregando = true;
  modalPlantarAberto = false;

  insumoCompradoSelecionado: InsumoComprado = null;

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
    this.insumoService.getComprasInsumoDaFazenda().subscribe({
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
      // Converter cada item em um InsumoComprado
      compra.itens.forEach((item) => {
        this.insumosComprados.push({
          compraId: compra.id!,
          insumoId: item.insumoId,
          nome: item.insumoNome,
          tipo: item.insumoTipo,
          unidadeMedida: item.unidadeMedida,
          quantidadeComprada: item.quantidadeComprada,
          quantidadeUsada: item.quantidadeUsada,
          valorUnitario: item.valorPorUnidade,
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

  abrirModalPlantar(insumo: InsumoComprado): void {
    this.insumoCompradoSelecionado = insumo;

    this.plantarForm
      .get('quantidade')
      ?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(this.getQuantidadeRestante(insumo)),
      ]);

    this.plantarForm.patchValue({
      quantidade: 1,
    });

    this.plantarForm.get('quantidade')?.updateValueAndValidity();
    this.modalPlantarAberto = true;
  }

  fecharModalPlantar(): void {
    this.modalPlantarAberto = false;
  }

  confirmarPlantar(): void {
    if (
      this.plantarForm.invalid ||
      !this.insumoCompradoSelecionado ||
      !this.userState.usuarioAtual
    ) {
      return;
    }

    const quantidadePlantar = this.plantarForm.get('quantidade')
      ?.value as number;

    const usuarioAtual = this.userState.usuarioAtual;

    if (!usuarioAtual) {
      this.mensagemErro = 'Erro: Usuário não identificado.';
      return;
    }

    this.plantacaoService
      .registrarPlantacao(
        this.insumoCompradoSelecionado.compraId,
        this.insumoCompradoSelecionado.insumoId,
        this.insumoCompradoSelecionado.nome,
        quantidadePlantar,
        usuarioAtual.uid,
        this.userState.nomeUsuario,
        usuarioAtual.fazenda?.id!
      )
      .subscribe({
        next: () => {
          this.plantacaoService
            .atualizarQuantidadeInsumo(
              this.insumoCompradoSelecionado.compraId,
              this.userState.usuarioAtual.fazenda.id,
              quantidadePlantar
            )
            .subscribe({
              next: () => {
                this.mensagemSucesso = `Plantio de ${quantidadePlantar} ${
                  this.insumoCompradoSelecionado!.unidadeMedida
                } de ${
                  this.insumoCompradoSelecionado!.nome
                } registrado com sucesso!`;
                this.insumoCompradoSelecionado = null;
              },
            });

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

  getQuantidadeRestante(insumoComprado: InsumoComprado) {
    return (
      (insumoComprado?.quantidadeComprada || 0) -
      (insumoComprado?.quantidadeUsada || 0)
    );
  }
}
