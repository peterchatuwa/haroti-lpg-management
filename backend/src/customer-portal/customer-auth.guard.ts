import {
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomerJwtPayload } from './customer-jwt-payload';

@Injectable()
export class CustomerAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = CustomerJwtPayload>(
    err: unknown,
    user: CustomerJwtPayload,
  ): TUser {
    if (err || !user || user.kind !== 'customer') {
      throw (
        err || new UnauthorizedException('Customer authentication required')
      );
    }
    return user as TUser;
  }
}

export const CurrentCustomer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CustomerJwtPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: CustomerJwtPayload }>();
    return request.user;
  },
);
