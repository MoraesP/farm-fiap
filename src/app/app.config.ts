import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withNavigationErrorHandler } from '@angular/router';

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withNavigationErrorHandler((error) => {
        const router = inject(Router);
        if (error.toString().includes('Cannot match')) {
          router.navigate(['/login']);
        }
      })
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
  ],
};
