import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Se o usuário já estiver logado, redireciona para a página inicial
  if (authService.isLoggedIn()) {
    return router.parseUrl('/home');
  }

  // Se não estiver logado, permite o acesso à página de login
  return true;
};
