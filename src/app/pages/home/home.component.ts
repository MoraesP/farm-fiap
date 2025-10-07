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
  constructor(private authService: AuthService, private router: Router) {}

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user?.email || 'Usuário';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
