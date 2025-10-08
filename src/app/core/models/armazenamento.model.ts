import { UnidadeMedida } from './insumo.model';

export interface LocalArmazenamento {
  id?: string;
  nome: string;
  tipoArmazenamento: UnidadeMedida;
  capacidadeMaxima: number;
  capacidadeUtilizada: number;
  fazendaId?: string;
  fazendaNome?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ArmazenamentoOcupacao {
  insumoId: string;
  insumoNome: string;
  quantidade: number;
  dataArmazenamento: Date;
}
