import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionGuardService } from '../session-gurard.service';
import { ToastrService } from 'ngx-toastr';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const sessionGuard = inject(SessionGuardService);
  const toastr = inject(ToastrService);

  // Skip auth for public APIs
  if (/\/auth\/register(\?|$)/.test(req.url)) {
    return next(req);
  }
  const jwt = sessionStorage.getItem('moneyfi.auth');
  if (jwt) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${jwt}` }
    });
  }
  return next(req).pipe(
    catchError(error => {
      const msg: string = typeof error.error === 'string' ? error.error : error.error?.message ?? '';
      const inactive = /not active/i.test(msg);
      const expired = !inactive && /expired|blacklisted/i.test(msg);
      if (error.status === 401 && !sessionGuard.sessionExpiredHandled && expired) {
        sessionGuard.sessionExpiredHandled = true;
        alert('Your session has expired. Please login again.');
        sessionStorage.removeItem('moneyfi.auth');
        sessionStorage.clear();
        router.navigate(['/']);
      } else if (error.status === 401 && !sessionGuard.sessionExpiredHandled && inactive) {
        sessionGuard.sessionExpiredHandled = true;
        alert(msg);
        sessionStorage.removeItem('moneyfi.auth');
        sessionStorage.clear();
        router.navigate(['/']);
      }
        else if (error.status === 500) toastr.error('Internal Server Error. Please try later')
        else if (error.status === 503) toastr.error('Service Unavailable. Please try later')
        else if (error.status === 403) toastr.error('You are not authorized to access')
      return throwError(() => error);
    })
  );
};
