import { UnidadeMedida } from './insumo.model';

export interface ProdutoColhido {
  id?: string;
  nome: string;
  tipo: UnidadeMedida;
  quantidade: number;
  plantacaoId: string;
  plantacaoNome: string;
  localArmazenamentoId: string;
  localArmazenamentoNome: string;
  fazendaId: string;
  fazendaNome: string;
  dataColheita: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
