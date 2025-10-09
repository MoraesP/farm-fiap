export interface Insumo {
  id?: string;
  nome: string;
  tipo: string;
  unidadeMedida: string;
  valorPorUnidade: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemCompraInsumo {
  insumoId: string;
  insumoNome: string;
  insumoTipo: string;
  unidadeMedida: string;
  valorPorUnidade: number;
  quantidadeComprada: number;
  quantidadeUsada: number;
  valorTotal: number;
  fazendaId: string;
  cooperadoUid: string;
  cooperadoNome: string;
}

export interface CompraInsumo {
  id?: string;
  itens: ItemCompraInsumo[];
  valorTotal: number;
  dataCompra: Date;
  status: StatusCompra;
}

export enum StatusCompra {
  PENDENTE = 'Pendente',
  CONCLUIDA = 'Concluída',
  CANCELADA = 'Cancelada',
}

export enum TipoInsumo {
  SEMENTE = 'Semente',
  FERTILIZANTE = 'Fertilizante',
  RACAO = 'Ração',
  OUTRO = 'Outro',
}

export enum UnidadeMedida {
  KG = 'Kilograma(s)',
  G = 'Grama(s)',
  L = 'Litro(s)',
  ML = 'Mililitro(s)',
  UN = 'Unidade(s)',
  CX = 'Caixa(s)',
  SC = 'Saca(s)',
}
