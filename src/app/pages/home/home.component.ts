import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserStateService } from '../../core/state/user-state.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  isLoggingOut = false;

  constructor(
    private userStateService: UserStateService,
    private authService: AuthService,
    private router: Router
  ) {}

  get userName(): string {
    const user = this.userStateService.usuarioAtual;
    return this.userStateService.name || 'Usuário';
  }

  get userPhotoURL(): string | null {
    const user = this.userStateService.usuarioAtual;
    return user?.photoURL || null;
  }

  logout(): void {
    this.isLoggingOut = true;
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggingOut = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Erro ao fazer logout:', error);
        this.isLoggingOut = false;
      },
    });
  }
}
