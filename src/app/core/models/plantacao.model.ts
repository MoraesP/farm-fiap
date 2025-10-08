import { Insumo } from './insumo.model';

export interface Plantacao {
  id?: string;
  compraId: string,
  insumoId: string;
  insumoNome: string;
  quantidadePlantada: number;
  dataPlantio: Date;
  cooperadoUid: string;
  cooperadoNome: string;
  fazendaId: string;
  colhida?: boolean;
  dataColheita?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsumoPlantado {
  id?: string;
  insumo: Insumo;
  quantidadePlantada: number;
  dataPlantio: Date;
  cooperadoUid: string;
  fazendaId: string;
}
