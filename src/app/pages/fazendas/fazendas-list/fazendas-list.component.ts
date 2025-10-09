import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Fazenda } from '../../../core/models/user.model';
import { FazendaService } from '../../../core/services/fazenda.service';

@Component({
  selector: 'app-fazendas-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fazendas-list.component.html',
  styleUrls: ['./fazendas-list.component.scss'],
})
export class FazendasListComponent implements OnInit {
  fazendas: Fazenda[] = [];

  error = '';

  novaFazenda = {
    nome: '',
    cnpj: '',
  };

  isLoading = false;
  modoEdicao = false;
  mostrarFormulario = false;

  fazendaEmEdicaoId: string = null;

  constructor(private fazendaService: FazendaService) {}

  ngOnInit(): void {
    this.carregarFazendas();
  }

  carregarFazendas(): void {
    this.isLoading = true;
    this.error = '';

    this.fazendaService.obterFazendas().subscribe({
      next: (fazendas) => {
        this.fazendas = fazendas;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar fazendas:', err);
        this.error =
          'Não foi possível carregar as fazendas. Tente novamente mais tarde.';
        this.isLoading = false;
      },
    });
  }

  abrirFormulario(fazenda?: Fazenda): void {
    if (fazenda) {
      this.modoEdicao = true;
      this.fazendaEmEdicaoId = fazenda.id!;
      this.novaFazenda = {
        nome: fazenda.nome,
        cnpj: fazenda.cnpj,
      };
    } else {
      this.modoEdicao = false;
      this.fazendaEmEdicaoId = null;
      this.novaFazenda = {
        nome: '',
        cnpj: '',
      };
    }

    this.mostrarFormulario = true;
  }

  fecharFormulario(): void {
    this.mostrarFormulario = false;
    this.modoEdicao = false;
    this.fazendaEmEdicaoId = null;
    this.novaFazenda = {
      nome: '',
      cnpj: '',
    };
  }

  salvarFazenda(): void {
    if (!this.novaFazenda.nome || !this.novaFazenda.cnpj) {
      this.error = 'Por favor, preencha todos os campos.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    if (this.modoEdicao && this.fazendaEmEdicaoId) {
      this.fazendaService
        .atualizarFazenda(this.fazendaEmEdicaoId, this.novaFazenda)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.fecharFormulario();
            this.carregarFazendas();
          },
          error: (err) => {
            console.error('Erro ao atualizar fazenda:', err);
            this.error =
              'Não foi possível atualizar a fazenda. Tente novamente mais tarde.';
            this.isLoading = false;
          },
        });
    } else {
      this.fazendaService.cadastrarFazenda(this.novaFazenda).subscribe({
        next: () => {
          this.isLoading = false;
          this.fecharFormulario();
          this.carregarFazendas();
        },
        error: (err) => {
          console.error('Erro ao cadastrar fazenda:', err);
          this.error =
            'Não foi possível cadastrar a fazenda. Tente novamente mais tarde.';
          this.isLoading = false;
        },
      });
    }
  }

  removerFazenda(id: string): void {
    if (confirm('Tem certeza que deseja remover esta fazenda?')) {
      this.isLoading = true;
      this.error = '';

      this.fazendaService.removerFazenda(id).subscribe({
        next: () => {
          this.isLoading = false;
          this.carregarFazendas();
        },
        error: (err) => {
          console.error('Erro ao remover fazenda:', err);
          this.error =
            'Não foi possível remover a fazenda. Tente novamente mais tarde.';
          this.isLoading = false;
        },
      });
    }
  }
}
