import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomeComponent } from '../pages/home/home.component';
import { InsumosComponent } from '../pages/insumos/insumos.component';
import { MeusInsumosComponent } from '../pages/meus-insumos/meus-insumos.component';
import { MinhaPlantacaoComponent } from '../pages/minha-plantacao/minha-plantacao.component';
import { FazendasListComponent } from '../pages/fazendas/fazendas-list/fazendas-list.component';
import { ArmazenamentoListComponent } from '../pages/armazenamento/armazenamento-list/armazenamento-list.component';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    SidebarComponent,
    HomeComponent,
    InsumosComponent,
    MeusInsumosComponent,
    MinhaPlantacaoComponent,
    FazendasListComponent,
    ArmazenamentoListComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  moduloAtual = 'home';

  onNavegar(modulo: string): void {
    this.moduloAtual = modulo;
  }
}
