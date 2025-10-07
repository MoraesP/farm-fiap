import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Output() navegarEvent = new EventEmitter<string>();

  moduloAtivo = 'home';

  menuItems = [
    { id: 'home', title: 'Início', icon: 'fa-home' },
    { id: 'sair', title: 'Sair' },
  ];

  constructor(private authService: AuthService, private router: Router) {}

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
