import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Perfil } from '../../core/models/user.model';
import {
  Notificacao,
  NotificacaoService,
} from '../../core/services/notificacao.service';
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
  notificacoesAbertas = false;

  constructor(
    public userState: UserStateService,
    public notificacaoService: NotificacaoService
  ) {}

  get usuarioAtual() {
    return this.userState.usuarioAtual;
  }

  getPerfilNome = (perfil?: Perfil) => {
    switch (perfil) {
      case Perfil.COOPERADO:
        return 'Cooperado';

      case Perfil.COOPERATIVA:
        return 'Cooperativa';

      default:
        return 'Sem Perfil';
    }
  };

  toggleNotificacoes(): void {
    this.notificacoesAbertas = !this.notificacoesAbertas;
  }

  marcarComoLida(notificacao: Notificacao): void {
    if (!notificacao.lida && notificacao.id) {
      this.notificacaoService
        .marcarComoLida(notificacao.id)
        .catch((error) =>
          console.error('Erro ao marcar notificação como lida:', error)
        );
    }

    if (
      notificacao.tipo === 'LOCAL_DISPONIVEL' &&
      notificacao.dadosAdicionais?.localId
    ) {
      console.log('Navegar para local:', notificacao.dadosAdicionais.localId);
    }
  }

  marcarTodasComoLidas(): void {
    this.notificacaoService
      .marcarTodasComoLidas()
      .catch((error) =>
        console.error('Erro ao marcar todas notificações como lidas:', error)
      );
  }
}
