export interface CustomerJwtPayload {
  sub: string;
  phone: string;
  fullName: string;
  kind: 'customer';
}
