import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Perfil } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { UserStateService } from '../../core/state/user-state.service';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  perfilPermitido?: Perfil[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @Output() navegarEvent = new EventEmitter<string>();

  moduloAtivo = 'home';
  menuItems: MenuItem[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private userState: UserStateService
  ) {}

  ngOnInit(): void {
    this.configurarMenuItems();
  }

  configurarMenuItems(): void {
    this.menuItems = [{ id: 'home', title: 'Início', icon: 'fa-home' }];

    this.menuItems.push({
      id: 'insumos',
      title: 'Insumos',
      icon: 'fa-seedling',
      perfilPermitido: [Perfil.COOPERADO],
    });

    if (this.userState.usuarioAtual?.perfil === Perfil.COOPERADO) {
      this.menuItems.push({
        id: 'meus-insumos',
        title: 'Meus Insumos',
        icon: 'fa-shopping-basket',
        perfilPermitido: [Perfil.COOPERADO],
      });
      this.menuItems.push({
        id: 'minha-plantacao',
        title: 'Minha Plantação',
        icon: 'fa-leaf',
        perfilPermitido: [Perfil.COOPERADO],
      });
    }

    if (this.userState.usuarioAtual?.perfil === Perfil.COOPERATIVA) {
      this.menuItems.push({
        id: 'fazendas',
        title: 'Fazendas',
        icon: 'fa-tractor',
        perfilPermitido: [Perfil.COOPERATIVA],
      });
      this.menuItems.push({
        id: 'armazenamento',
        title: 'Locais de Armazenamento',
        icon: 'fa-warehouse',
        perfilPermitido: [Perfil.COOPERATIVA],
      });
    }

    this.menuItems.push({ id: 'sair', title: 'Sair', icon: 'fa-sign-out-alt' });
  }

  navegar(moduloId: string): void {
    if (moduloId === 'sair') {
      this.logout();
    } else {
      this.moduloAtivo = moduloId;
      this.navegarEvent.emit(moduloId);
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Erro ao fazer logout:', error);
      },
    });
  }
}
