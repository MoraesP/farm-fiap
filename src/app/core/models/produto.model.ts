import { UnidadeMedida } from './insumo.model';

export interface Produto {
  id?: string;
  nome: string;
  unidadeMedida: UnidadeMedida;
  precoVenda: number;
  insumoOrigemId: string;
  insumoOrigemNome: string;
  createdAt: Date;
  updatedAt: Date;
}
