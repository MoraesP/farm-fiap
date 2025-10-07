export interface Produto {
  id: string; // ID do documento no Firestore
  nome: string;
  descricao: string;
  tipo: 'Grão' | 'Hortaliça' | 'Fruta' | 'Laticínio' | 'Outro';
  quantidadeEstoque: number;
  unidadeMedida: 'kg' | 'litro' | 'unidade' | 'saca';
  precoVenda: number;
  dataProducao: Date; // Data da colheita ou produção
  produtorId: string; // UID do usuário que cadastrou
  produtorNome: string; // Nome do produtor para fácil exibição
  dataCadastro: Date; // Data em que o registro foi criado
}
