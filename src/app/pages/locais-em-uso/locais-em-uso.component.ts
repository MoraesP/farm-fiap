import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LocalArmazenamento } from '../../core/models/armazenamento.model';
import { ArmazenamentoService } from '../../core/services/armazenamento.service';
import { UserStateService } from '../../core/state/user-state.service';
import {
  FirebaseTimestamp,
  formatarData,
} from '../../core/utils/date-firebase';

@Component({
  selector: 'app-locais-em-uso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './locais-em-uso.component.html',
  styleUrls: ['./locais-em-uso.component.scss'],
})
export class LocaisEmUsoComponent implements OnInit {
  locaisArmazenamento: LocalArmazenamento[] = [];
  carregando = true;
  mensagemErro = '';

  constructor(
    private armazenamentoService: ArmazenamentoService,
    private userState: UserStateService
  ) {}

  ngOnInit(): void {
    this.carregarLocaisEmUso();
  }

  carregarLocaisEmUso(): void {
    this.carregando = true;
    const usuarioAtual = this.userState.usuarioAtual;

    if (!usuarioAtual || !usuarioAtual.fazenda) {
      this.mensagemErro = 'Usuário não está associado a uma fazenda.';
      this.carregando = false;
      return;
    }

    // Buscar todos os locais de armazenamento
    this.armazenamentoService.obterLocaisArmazenamento().subscribe({
      next: (locais) => {
        // Filtrar apenas os locais que estão sendo usados pela fazenda do usuário
        this.locaisArmazenamento = locais.filter(
          (local) =>
            local.fazendaId === usuarioAtual.fazenda?.id &&
            local.capacidadeUtilizada > 0
        );
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar locais de armazenamento:', err);
        this.mensagemErro =
          'Erro ao carregar locais de armazenamento. Tente novamente.';
        this.carregando = false;
      },
    });
  }

  formatarData(data?: Date | FirebaseTimestamp): string {
    if (!data) {
      return 'Sem data';
    }
    return formatarData(data);
  }

  calcularPorcentagemUtilizada(local: LocalArmazenamento): number {
    return (local.capacidadeUtilizada / local.capacidadeMaxima) * 100;
  }

  obterClasseProgresso(porcentagem: number): string {
    if (porcentagem < 50) {
      return 'bg-success';
    } else if (porcentagem < 75) {
      return 'bg-warning';
    } else {
      return 'bg-danger';
    }
  }
}
