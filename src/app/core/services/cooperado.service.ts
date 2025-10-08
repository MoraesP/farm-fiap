import { Injectable } from '@angular/core';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Observable, from, map } from 'rxjs';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class CooperadoService {
  constructor(private firebaseService: FirebaseService) {}

  getCooperados(): Observable<{ uid: string; nome: string }[]> {
    const firestore = this.firebaseService.getFirestore();
    const usersRef = collection(firestore, 'users');
    const cooperadosQuery = query(usersRef, where('perfil', '==', 'COOPERADO'));

    return from(getDocs(cooperadosQuery)).pipe(
      map((querySnapshot) => {
        return querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            nome: `${data['primeiroNome']} ${data['ultimoNome']}`,
          };
        });
      })
    );
  }
}
