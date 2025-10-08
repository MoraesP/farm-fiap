import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserStateService } from '../../core/state/user-state.service';
import { Perfil } from '../../core/models/user.model';

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

  get usuarioAtual() {
    return this.userState.usuarioAtual;
  }

  getPerfilNome = (perfil: Perfil) => {
    switch (perfil) {
      case Perfil.COOPERADO:
        return 'Cooperado';

      case Perfil.COOPERATIVA:
        return 'Cooperativa';

      default:
        return 'Sem perfil';
    }
  };
}
