import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Insumo, UnidadeMedida } from '../../core/models/insumo.model';
import { Produto } from '../../core/models/produto.model';
import { InsumoService } from '../../core/services/insumo.service';
import { ProdutoService } from '../../core/services/produto.service';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.scss'],
})
export class ProdutosComponent implements OnInit {
  produtos: Produto[] = [];
  insumos: Insumo[] = [];

  produtoForm: FormGroup;

  carregando = true;
  modalCadastroAberto = false;

  unidadesMedida = Object.values(UnidadeMedida);

  mensagemErro = '';
  mensagemSucesso = '';

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private insumoService: InsumoService
  ) {
    this.produtoForm = this.criarFormularioProduto();
  }

  ngOnInit(): void {
    this.carregarProdutos();
    this.carregarInsumos();
  }

  carregarProdutos(): void {
    this.carregando = true;
    this.produtoService.getProdutos().subscribe({
      next: (produtos) => {
        this.produtos = produtos;
        this.carregando = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar produtos:', erro);
        this.mensagemErro =
          'Erro ao carregar produtos. Tente novamente mais tarde.';
        this.carregando = false;
      },
    });
  }

  carregarInsumos(): void {
    this.insumoService.getInsumos().subscribe({
      next: (insumos) => {
        this.insumos = insumos;
      },
      error: (erro) => {
        console.error('Erro ao carregar insumos:', erro);
      },
    });
  }

  criarFormularioProduto(): FormGroup {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      unidadeMedida: ['', Validators.required],
      precoVenda: [0, [Validators.required, Validators.min(0.01)]],
      insumoOrigem: [null, Validators.required],
    });
  }

  abrirModalCadastro(): void {
    this.produtoForm.reset();
    this.modalCadastroAberto = true;
  }

  fecharModalCadastro(): void {
    this.modalCadastroAberto = false;
  }

  cadastrarProduto(): void {
    if (this.produtoForm.invalid) {
      this.produtoForm.markAllAsTouched();
      return;
    }

    const insumoSelecionado = this.produtoForm.get('insumoOrigem')
      ?.value as Insumo;

    const novoProduto = {
      nome: this.produtoForm.get('nome')?.value,
      unidadeMedida: this.produtoForm.get('unidadeMedida')?.value,
      precoVenda: this.produtoForm.get('precoVenda')?.value,
      insumoOrigemId: insumoSelecionado.id!,
      insumoOrigemNome: insumoSelecionado.nome,
    };

    this.produtoService.adicionarProduto(novoProduto).subscribe({
      next: () => {
        this.mensagemSucesso = 'Produto cadastrado com sucesso!';
        this.fecharModalCadastro();
        this.carregarProdutos();
        setTimeout(() => {
          this.mensagemSucesso = '';
        }, 3000);
      },
      error: (erro) => {
        console.error('Erro ao cadastrar produto:', erro);
        this.mensagemErro =
          'Erro ao cadastrar produto. Tente novamente mais tarde.';
        setTimeout(() => {
          this.mensagemErro = '';
        }, 3000);
      },
    });
  }

  removerProduto(id: string): void {
    if (confirm('Tem certeza que deseja remover este produto?')) {
      this.produtoService.removerProduto(id).subscribe({
        next: () => {
          this.mensagemSucesso = 'Produto removido com sucesso!';
          this.carregarProdutos();
          setTimeout(() => {
            this.mensagemSucesso = '';
          }, 3000);
        },
        error: (erro) => {
          console.error('Erro ao remover produto:', erro);
          this.mensagemErro =
            'Erro ao remover produto. Tente novamente mais tarde.';
          setTimeout(() => {
            this.mensagemErro = '';
          }, 3000);
        },
      });
    }
  }
}
