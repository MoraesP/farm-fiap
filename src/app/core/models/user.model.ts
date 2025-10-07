export interface User {
  uid: string;
  email: string;
  photoURL?: string;
}

export interface UserProfile extends User {
  firstName: string;
  lastName: string;
  cpf: string;
  birthDate: string;
  createdAt: Date;
  updatedAt: Date;
}
