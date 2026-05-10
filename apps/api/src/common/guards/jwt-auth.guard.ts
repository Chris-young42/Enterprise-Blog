import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { catchError, isObservable, map, Observable, of } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const activate = super.canActivate(context);
    if (!isPublic) {
      return activate;
    }

    // Public routes can still parse JWT when provided, but must not block anonymous access.
    if (activate instanceof Promise) {
      return activate.then(() => true).catch(() => true);
    }
    if (isObservable(activate)) {
      return (activate as Observable<boolean>).pipe(
        map(() => true),
        catchError(() => of(true)),
      );
    }
    return true;
  }
}
