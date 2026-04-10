import { Request } from 'express';
import { UserRole } from '@/database/entities/user.entity';
export interface AuthenticatedUser {
    sub: number;
    userName: string;
    role: UserRole;
}
export type RequestWithUser = Request & {
    user?: AuthenticatedUser;
};
