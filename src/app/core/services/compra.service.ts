import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CompraInsumo } from '../models/insumo.model';
import { InsumoService } from './insumo.service';

@Injectable({
  providedIn: 'root',
})
export class CompraService {
  constructor(private insumoService: InsumoService) {}

  /**
   * Obtém as compras de insumos de um usuário específico
   * @param uid ID do usuário
   */
  getCompras(uid: string): Observable<CompraInsumo[]> {
    // Utilizamos o serviço de insumos para obter as compras do usuário
    return this.insumoService.getComprasInsumoDoUsuario();
  }

  /**
   * Obtém as compras de insumos de uma fazenda específica
   * @param fazendaId ID da fazenda
   */
  getComprasPorFazenda(fazendaId: string): Observable<CompraInsumo[]> {
    // Utilizamos o serviço de insumos para obter as compras da fazenda
    return this.insumoService.getComprasInsumoDaFazenda();
  }

  /**
   * Registra uma nova compra de insumo
   * @param compra Dados da compra
   */
  registrarCompra(
    compra: Omit<CompraInsumo, 'id' | 'dataCompra' | 'status'>
  ): Observable<CompraInsumo> {
    return this.insumoService.registrarCompraInsumo(compra);
  }
}
