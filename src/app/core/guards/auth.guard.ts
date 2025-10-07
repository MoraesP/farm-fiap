import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserStateService } from '../state/user-state.service';

export const authGuard: CanActivateFn = (route, state) => {
  const userState = inject(UserStateService);
  const router = inject(Router);

  if (userState.estaLogado) {
    return true;
  }

  return router.parseUrl('/login');
};
