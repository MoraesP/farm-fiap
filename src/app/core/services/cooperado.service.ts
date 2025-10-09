import { Injectable } from '@angular/core';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Observable, from, map } from 'rxjs';
import { Perfil, PerfilUsuario } from '../models/user.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class CooperadoService {
  private readonly USUARIOS = 'users';

  constructor(private firebaseService: FirebaseService) {}

  getCooperados(): Observable<
    { uid: string; nome: string; fazendaId: string }[]
  > {
    const firestore = this.firebaseService.getFirestore();
    const usersRef = collection(firestore, this.USUARIOS);

    const cooperadosQuery = query(
      usersRef,
      where('perfil', '==', Perfil.COOPERADO)
    );

    return from(getDocs(cooperadosQuery)).pipe(
      map((querySnapshot) => {
        return querySnapshot.docs.map((doc) => {
          const data = doc.data() as PerfilUsuario;
          return {
            uid: doc.id,
            nome: `${data['primeiroNome']} ${data['ultimoNome']}`,
            fazendaId: data['fazenda']?.id!,
          };
        });
      })
    );
  }
}
