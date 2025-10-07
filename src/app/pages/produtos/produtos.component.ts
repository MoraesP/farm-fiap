import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { Produto } from '../../core/models/produto.model';
import { ProdutoService } from '../../core/services/produto.service';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.scss'],
})
export class ProdutosComponent implements OnInit {
  produtoForm: FormGroup;
  produtos$: Observable<Produto[]>;
  tiposProduto = ['Grão', 'Hortaliça', 'Fruta', 'Laticínio', 'Outro'];
  unidadesMedida = ['kg', 'litro', 'unidade', 'saca'];

  constructor(private fb: FormBuilder, private produtoService: ProdutoService) {
    this.produtoForm = this.fb.group({
      nome: ['', Validators.required],
      descricao: ['', Validators.required],
      tipo: ['Grão', Validators.required],
      quantidadeEstoque: [0, [Validators.required, Validators.min(0)]],
      unidadeMedida: ['kg', Validators.required],
      precoVenda: [0, [Validators.required, Validators.min(0)]],
      dataProducao: ['', Validators.required],
    });

    this.produtos$ = this.produtoService.buscarProdutosDoUsuario();
  }

  ngOnInit(): void {}

  cadastrarProduto(): void {
    if (this.produtoForm.invalid) {
      return;
    }

    const dadosFormulario = this.produtoForm.value;
    this.produtoService.adicionarProduto(dadosFormulario).subscribe(() => {
      // Recarregar a lista de produtos após o cadastro
      this.produtos$ = this.produtoService.buscarProdutosDoUsuario();
      this.produtoForm.reset({
        tipo: 'Grão',
        unidadeMedida: 'kg',
        quantidadeEstoque: 0,
        precoVenda: 0,
      });
    });
  }

  removerProduto(id: string): void {
    this.produtoService.removerProduto(id).subscribe(() => {
      this.produtos$ = this.produtoService.buscarProdutosDoUsuario();
    });
  }
}
