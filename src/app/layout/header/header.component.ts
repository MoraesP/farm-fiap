import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserStateService } from '../../core/state/user-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  isLoggingOut = false;

  constructor(
    public userState: UserStateService,
    private authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.isLoggingOut = true;
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
      this.isLoggingOut = false;
    });
  }
}
