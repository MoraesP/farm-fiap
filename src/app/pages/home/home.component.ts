import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  isLoggingOut = false;

  constructor(private authService: AuthService, private router: Router) {}

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user?.displayName || user?.email || 'Usuário';
  }

  get userPhotoURL(): string | null {
    const user = this.authService.getCurrentUser();
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
