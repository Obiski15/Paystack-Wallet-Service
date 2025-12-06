import type { UserRole } from '../entities/user.entity';

interface IUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

interface IUserPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      apiKey?: {
        id: string;
        permissions: string[];
        serviceName: string;
      };
    }
  }
}

export { IUser, IUserPayload };
