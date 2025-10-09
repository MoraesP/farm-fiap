import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { UserStateService } from '../state/user-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userStateService = inject(UserStateService);

  if (userStateService.estaLogado) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer simulated-jwt-token`,
      },
    });
    return next(authReq);
  }

  return next(req);
};
