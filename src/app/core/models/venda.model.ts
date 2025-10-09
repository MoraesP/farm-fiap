export enum RegiaoVenda {
  NORTE = 'Norte',
  NORDESTE = 'Nordeste',
  CENTRO_OESTE = 'Centro-Oeste',
  SUDESTE = 'Sudeste',
  SUL = 'Sul'
}

export interface Venda {
  id?: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  regiao: RegiaoVenda;
  localArmazenamentoId: string;
  fazendaId: string;
  fazendaNome: string;
  dataVenda: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
