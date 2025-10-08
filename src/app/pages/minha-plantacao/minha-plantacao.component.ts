import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Plantacao } from '../../core/models/plantacao.model';
import { PlantacaoService } from '../../core/services/plantacao.service';
import { UserStateService } from '../../core/state/user-state.service';
import {
  FirebaseTimestamp,
  formatarData,
} from '../../core/utils/date-firebase';

@Component({
  selector: 'app-minha-plantacao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './minha-plantacao.component.html',
  styleUrls: ['./minha-plantacao.component.scss'],
})
export class MinhaPlantacaoComponent implements OnInit {
  plantacoes: Plantacao[] = [];
  carregando = true;
  mensagemErro = '';

  constructor(
    private plantacaoService: PlantacaoService,
    private userState: UserStateService
  ) {}

  ngOnInit(): void {
    this.carregarPlantacoes();
  }

  carregarPlantacoes(): void {
    this.carregando = true;
    const usuarioAtual = this.userState.usuarioAtual;

    if (!usuarioAtual) {
      this.mensagemErro = 'Usuário não identificado.';
      this.carregando = false;
      return;
    }

    this.plantacaoService.getPlantacoes(usuarioAtual.fazenda?.id!).subscribe({
      next: (plantacoes) => {
        this.plantacoes = plantacoes;
        this.carregando = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar plantações:', erro);
        this.mensagemErro =
          'Erro ao carregar plantações. Tente novamente mais tarde.';
        this.carregando = false;
      },
    });
  }

  calcularTotalPlantado(): number {
    return this.plantacoes.length;
  }

  formatarData(data: Date | FirebaseTimestamp): string {
    return formatarData(data);
  }
}
