import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Se o usuário estiver autenticado, adicione o token de autenticação
  if (authService.isLoggedIn()) {
    // Em um cenário real, você obteria o token do serviço de autenticação
    // Aqui estamos apenas simulando
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer simulated-jwt-token`,
      },
    });
    return next(authReq);
  }

  return next(req);
};
