import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CompraInsumo,
  Insumo,
  ItemCompraInsumo,
  TipoInsumo,
  UnidadeMedida,
} from '../../core/models/insumo.model';
import { Perfil } from '../../core/models/user.model';
import { CooperadoService } from '../../core/services/cooperado.service';
import { InsumoService } from '../../core/services/insumo.service';
import { UserStateService } from '../../core/state/user-state.service';

@Component({
  selector: 'app-insumos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './insumos.component.html',
  styleUrls: ['./insumos.component.scss'],
})
export class InsumosComponent implements OnInit {
  insumos: Insumo[] = [];
  cooperados: { uid: string; nome: string }[] = [];

  compraForm: FormGroup;
  cadastroForm: FormGroup;

  carregando = true;
  modalCompraAberto = false;
  modalCadastroAberto = false;

  tiposInsumo = Object.values(TipoInsumo);
  unidadesMedida = Object.values(UnidadeMedida);

  mensagemErro = '';
  mensagemSucesso = '';

  constructor(
    private fb: FormBuilder,
    private userState: UserStateService,
    private insumoService: InsumoService,
    private cooperadoService: CooperadoService
  ) {
    this.compraForm = this.criarFormularioCompra();
    this.cadastroForm = this.criarFormularioCadastro();
  }

  ngOnInit(): void {
    this.carregarInsumos();
    this.carregarCooperados();
  }

  carregarInsumos(): void {
    this.carregando = true;
    this.insumoService.getInsumos().subscribe({
      next: (insumos) => {
        this.insumos = insumos;
        this.carregando = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar insumos:', erro);
        this.mensagemErro =
          'Erro ao carregar insumos. Tente novamente mais tarde.';
        this.carregando = false;
      },
    });
  }

  carregarCooperados(): void {
    this.cooperadoService.getCooperados().subscribe({
      next: (cooperados) => {
        this.cooperados = cooperados;
      },
      error: (erro) => {
        console.error('Erro ao carregar cooperados:', erro);
      },
    });
  }

  criarFormularioCompra(): FormGroup {
    return this.fb.group({
      insumo: [null, Validators.required],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      participantes: this.fb.array([]),
    });
  }

  criarFormularioCadastro(): FormGroup {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      tipo: ['', Validators.required],
      unidadeMedida: ['', Validators.required],
      valorPorUnidade: [0, [Validators.required, Validators.min(0.01)]],
      quantidadeDisponivel: [0, [Validators.required, Validators.min(0)]],
    });
  }

  get participantesFormArray(): FormArray {
    return this.compraForm.get('participantes') as FormArray;
  }

  adicionarParticipante(): void {
    const participanteForm = this.fb.group({
      cooperadoUid: ['', Validators.required],
      quantidade: [1, [Validators.required, Validators.min(1)]],
    });

    this.participantesFormArray.push(participanteForm);
  }

  removerParticipante(index: number): void {
    this.participantesFormArray.removeAt(index);
  }

  abrirModalCompra(insumo?: Insumo): void {
    this.compraForm.reset();
    this.participantesFormArray.clear();

    if (insumo) {
      this.compraForm.patchValue({ insumo });
    }

    this.modalCompraAberto = true;
  }

  fecharModalCompra(): void {
    this.modalCompraAberto = false;
  }

  abrirModalCadastro(): void {
    this.cadastroForm.reset();
    this.modalCadastroAberto = true;
  }

  fecharModalCadastro(): void {
    this.modalCadastroAberto = false;
  }

  calcularTotalPorParticipante(index: number): number {
    const participante = this.participantesFormArray.at(index);
    const insumo = this.compraForm.get('insumo')?.value as Insumo;

    if (!participante || !insumo) {
      return 0;
    }

    const quantidade = participante.get('quantidade')?.value || 0;
    return quantidade * insumo.valorPorUnidade;
  }

  calcularTotalUsuarioAtual(): number {
    const insumo = this.compraForm.get('insumo')?.value as Insumo;
    const quantidade = this.compraForm.get('quantidade')?.value || 0;

    if (!insumo) {
      return 0;
    }

    return quantidade * insumo.valorPorUnidade;
  }

  calcularTotalCompra(): number {
    let total = this.calcularTotalUsuarioAtual();

    for (let i = 0; i < this.participantesFormArray.length; i++) {
      total += this.calcularTotalPorParticipante(i);
    }

    return total;
  }

  confirmarCompra(): void {
    if (this.compraForm.invalid) {
      this.compraForm.markAllAsTouched();
      return;
    }

    const insumo = this.compraForm.get('insumo')?.value as Insumo;
    const quantidadeUsuarioAtual =
      this.compraForm.get('quantidade')?.value || 0;
    const usuarioAtual = this.userState.usuarioAtual!;

    const itens: ItemCompraInsumo[] = [
      {
        insumo,
        quantidade: quantidadeUsuarioAtual,
        valorTotal: this.calcularTotalUsuarioAtual(),
        cooperadoUid: usuarioAtual.uid,
        cooperadoNome: this.userState.nomeUsuario,
      },
    ];

    // Adicionar itens dos outros participantes
    for (let i = 0; i < this.participantesFormArray.length; i++) {
      const participante = this.participantesFormArray.at(i);
      const cooperadoUid = participante.get('cooperadoUid')?.value;
      const quantidade = participante.get('quantidade')?.value || 0;
      const cooperado = this.cooperados.find((c) => c.uid === cooperadoUid);

      if (cooperado) {
        itens.push({
          insumo,
          quantidade,
          valorTotal: this.calcularTotalPorParticipante(i),
          cooperadoUid: cooperado.uid,
          cooperadoNome: cooperado.nome,
        });
      }
    }

    const compra: Omit<CompraInsumo, 'id' | 'dataCompra' | 'status'> = {
      itens,
      valorTotal: this.calcularTotalCompra(),
    };

    this.insumoService.registrarCompraInsumo(compra).subscribe({
      next: () => {
        this.mensagemSucesso = 'Compra realizada com sucesso!';
        this.fecharModalCompra();
        this.carregarInsumos();
        setTimeout(() => {
          this.mensagemSucesso = '';
        }, 3000);
      },
      error: (erro) => {
        console.error('Erro ao registrar compra:', erro);
        this.mensagemErro =
          'Erro ao registrar compra. Tente novamente mais tarde.';
        setTimeout(() => {
          this.mensagemErro = '';
        }, 3000);
      },
    });
  }

  cadastrarInsumo(): void {
    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }

    const novoInsumo = {
      nome: this.cadastroForm.get('nome')?.value,
      tipo: this.cadastroForm.get('tipo')?.value,
      unidadeMedida: this.cadastroForm.get('unidadeMedida')?.value,
      valorPorUnidade: this.cadastroForm.get('valorPorUnidade')?.value,
      quantidadeDisponivel: this.cadastroForm.get('quantidadeDisponivel')
        ?.value,
    };

    this.insumoService.adicionarInsumo(novoInsumo).subscribe({
      next: () => {
        this.mensagemSucesso = 'Insumo cadastrado com sucesso!';
        this.fecharModalCadastro();
        this.carregarInsumos();
        setTimeout(() => {
          this.mensagemSucesso = '';
        }, 3000);
      },
      error: (erro) => {
        console.error('Erro ao cadastrar insumo:', erro);
        this.mensagemErro =
          'Erro ao cadastrar insumo. Tente novamente mais tarde.';
        setTimeout(() => {
          this.mensagemErro = '';
        }, 3000);
      },
    });
  }

  get eCooperado(): boolean {
    return this.userState.usuarioAtual?.perfil === Perfil.COOPERADO;
  }
}
