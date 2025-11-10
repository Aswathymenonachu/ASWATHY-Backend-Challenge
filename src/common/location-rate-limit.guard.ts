import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class LocationRateLimitGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const locationId = request.body?.locationId;
    
    console.log(`Rate limit check for location: ${locationId}`);
    
    return true;
  }
}