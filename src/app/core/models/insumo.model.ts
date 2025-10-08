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
  PENDENTE = 'PENDENTE',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA',
}

export enum TipoInsumo {
  SEMENTE = 'SEMENTE',
  FERTILIZANTE = 'FERTILIZANTE',
  RACAO = 'RACAO',
  DEFENSIVO = 'DEFENSIVO',
  OUTRO = 'OUTRO',
}

export enum UnidadeMedida {
  KG = 'kg',
  G = 'g',
  L = 'l',
  ML = 'ml',
  UN = 'un',
  CX = 'cx',
  SC = 'sc',
}
