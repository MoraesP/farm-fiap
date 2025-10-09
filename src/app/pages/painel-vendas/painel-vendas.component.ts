import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMapsModule, MapInfoWindow } from '@angular/google-maps';
import { RegiaoVenda, Venda } from '../../core/models/venda.model';
import { VendaService } from '../../core/services/venda.service';
import { UserStateService } from '../../core/state/user-state.service';

interface DadosRegiao {
  regiao: RegiaoVenda;
  quantidade: number;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-painel-vendas',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './painel-vendas.component.html',
  styleUrls: ['./painel-vendas.component.scss'],
})
export class PainelVendasComponent implements OnInit {
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;

  mapOptions: google.maps.MapOptions = {
    center: { lat: -15.7801, lng: -47.9292 },
    zoom: 4,
    mapTypeId: 'roadmap',
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
  };

  heatmapData: google.maps.visualization.WeightedLocation[] = [];
  heatmapOptions = {
    radius: 20,
    opacity: 0.7,
    gradient: [
      'rgba(0, 255, 255, 0)',
      'rgba(0, 255, 255, 1)',
      'rgba(0, 191, 255, 1)',
      'rgba(0, 127, 255, 1)',
      'rgba(0, 63, 255, 1)',
      'rgba(0, 0, 255, 1)',
      'rgba(0, 0, 223, 1)',
      'rgba(0, 0, 191, 1)',
      'rgba(0, 0, 159, 1)',
      'rgba(0, 0, 127, 1)',
      'rgba(63, 0, 91, 1)',
      'rgba(127, 0, 63, 1)',
      'rgba(191, 0, 31, 1)',
      'rgba(255, 0, 0, 1)',
    ],
  };

  vendas: Venda[] = [];

  dadosRegioes: DadosRegiao[] = [];

  carregando = true;
  mensagemErro = '';

  coordenadasRegioes = {
    [RegiaoVenda.NORTE]: { lat: -3.1019, lng: -60.0251 },
    [RegiaoVenda.NORDESTE]: { lat: -8.0476, lng: -34.877 },
    [RegiaoVenda.CENTRO_OESTE]: { lat: -15.7801, lng: -47.9292 },
    [RegiaoVenda.SUDESTE]: { lat: -23.5505, lng: -46.6333 },
    [RegiaoVenda.SUL]: { lat: -30.0277, lng: -51.2287 },
  };

  constructor(
    private vendaService: VendaService,
    private userState: UserStateService
  ) {}

  ngOnInit(): void {
    this.carregarVendas();
  }

  carregarVendas(): void {
    this.carregando = true;
    const usuarioAtual = this.userState.usuarioAtual;

    if (!usuarioAtual || !usuarioAtual.fazenda) {
      this.mensagemErro = 'Usuário não está associado a uma fazenda.';
      this.carregando = false;
      return;
    }

    this.vendaService.obterVendas(usuarioAtual.fazenda.id).subscribe({
      next: (vendas) => {
        this.vendas = vendas;
        this.processarDadosVendas();
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar vendas:', err);
        this.mensagemErro =
          'Erro ao carregar dados de vendas. Tente novamente.';
        this.carregando = false;
      },
    });
  }

  processarDadosVendas(): void {
    const vendasPorRegiao = new Map<RegiaoVenda, number>();

    Object.values(RegiaoVenda).forEach((regiao) => {
      vendasPorRegiao.set(regiao, 0);
    });

    this.vendas.forEach((venda) => {
      const quantidadeAtual = vendasPorRegiao.get(venda.regiao) || 0;
      vendasPorRegiao.set(venda.regiao, quantidadeAtual + venda.quantidade);
    });

    this.dadosRegioes = Array.from(vendasPorRegiao.entries()).map(
      ([regiao, quantidade]) => {
        const coordenadas = this.coordenadasRegioes[regiao];
        return {
          regiao,
          quantidade,
          lat: coordenadas.lat,
          lng: coordenadas.lng,
        };
      }
    );

    this.criarDadosMapaCalor();
  }

  criarDadosMapaCalor(): void {
    this.heatmapData = this.dadosRegioes
      .filter((item) => item.quantidade > 0)
      .map((item) => {
        return {
          location: new google.maps.LatLng(item.lat, item.lng),
          weight: item.quantidade,
        };
      });
  }

  onMapInitialized(map: google.maps.Map): void {
    if (this.heatmapData.length > 0) {
      const heatmap = new google.maps.visualization.HeatmapLayer({
        data: this.heatmapData,
        map: map,
        radius: this.heatmapOptions.radius,
        opacity: this.heatmapOptions.opacity,
        gradient: this.heatmapOptions.gradient,
      });
    }
  }

  get totalVendas() {
    const quantidadeTotal = this.vendas.reduce(
      (total, venda) => total + venda.quantidade,
      0
    );
    return this.formatarNumero(quantidadeTotal);
  }

  get quantidadePorRegiao() {
    const quantidadeTotal = this.dadosRegioes.reduce(
      (total, regiao) => total + regiao.quantidade,
      0
    );
    return this.formatarNumero(quantidadeTotal);
  }

  formatarNumero(numero: number): string {
    return numero.toLocaleString('pt-BR');
  }

  getDadosBarraProgressoPorRegiao(regiao: DadosRegiao) {
    return (
      (regiao.quantidade /
        this.dadosRegioes.reduce((total, r) => total + r.quantidade, 0)) *
      100
    );
  }
}
