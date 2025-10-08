import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CompraInsumo } from '../../core/models/insumo.model';
import { InsumoService } from '../../core/services/insumo.service';
import { UserStateService } from '../../core/state/user-state.service';
import { FirebaseTimestamp, compararDatas, formatarData } from '../../core/utils/date-firebase';

interface InsumoComprado {
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
  imports: [CommonModule],
  templateUrl: './meus-insumos.component.html',
  styleUrls: ['./meus-insumos.component.scss'],
})
export class MeusInsumosComponent implements OnInit {
  insumosComprados: InsumoComprado[] = [];
  carregando = true;
  mensagemErro = '';

  constructor(
    private insumoService: InsumoService,
    private userState: UserStateService
  ) {}

  ngOnInit(): void {
    this.carregarInsumosComprados();
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
    this.insumosComprados.sort((a, b) => compararDatas(a.dataCompra, b.dataCompra));
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
}
