import { Role } from '../../common/constants/roles';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}



