import { UnidadeMedida } from './insumo.model';

export interface ProdutoColhido {
  id?: string;
  insumoId: string;
  produtoId: string;
  produtoNome: string;
  produtoUnidadeMedida: UnidadeMedida;
  quantidade: number;
  plantacaoId: string;
  localArmazenamentoId: string;
  localArmazenamentoNome: string;
  fazendaId: string;
  fazendaNome: string;
  dataColheita: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
