export interface Usuario {
  uid: string;
  email: string;
}

export interface PerfilUsuario extends Usuario {
  cpf: string;
  primeiroNome: string;
  ultimoNome: string;
  dataNascimento: string;
  createdAt: Date;
  updatedAt: Date;
  perfil: Perfil;
  fazenda?: Fazenda;
}

export interface Fazenda {
  id?: string;
  nome: string;
  cnpj: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum Perfil {
  COOPERATIVA = 'COOPERATIVA',
  COOPERADO = 'COOPERADO',
}
