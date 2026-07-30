import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string;      // user id
  email: string;
  schoolId: string;
  roles: string[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException({
        code: 'ACCOUNT_LOCKED',
        message: 'Account is locked. Please try again later or contact your administrator.',
      });
    }

    // Check if account is active
    if (user.status === 'INACTIVE') {
      throw new ForbiddenException({ code: 'ACCOUNT_INACTIVE', message: 'Your account has been deactivated.' });
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password).catch(() => false);

    if (!isPasswordValid) {
      // Increment failed login count
      const maxAttempts = this.config.get<number>('login.maxAttempts', 5);
      const lockoutMinutes = this.config.get<number>('login.lockoutMinutes', 30);
      const newFailedCount = user.failedLoginCount + 1;

      const updateData: { failedLoginCount: number; lockedUntil?: Date | null; status?: UserStatus } = {
        failedLoginCount: newFailedCount,
      };

      if (newFailedCount >= maxAttempts) {
        updateData.lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
        this.logger.warn(`Account locked for user: ${user.email} after ${newFailedCount} failed attempts`);
      }

      await this.prisma.user.update({ where: { id: user.id }, data: updateData });

      // Log the failed attempt
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          schoolId: user.schoolId,
          action: newFailedCount >= maxAttempts ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
          module: 'auth',
          ipAddress,
          userAgent,
        },
      });

      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    // Successful login — reset failed count
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const roles = user.userRoles.map((ur: any) => ur.role.name);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      schoolId: user.schoolId,
      roles,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('auth.jwtRefreshSecret'),
      expiresIn: this.config.get('auth.jwtRefreshExpiry', '7d'),
    });

    // Audit log successful login
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        schoolId: user.schoolId,
        action: 'LOGIN_SUCCESS',
        module: 'auth',
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        schoolId: user.schoolId,
        roles,
      },
    };
  }

  async logout(userId: string, ipAddress?: string) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        module: 'auth',
        ipAddress,
      },
    });
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.get('auth.jwtRefreshSecret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { userRoles: { include: { role: true } } },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException({ code: 'SESSION_INVALID', message: 'Session is no longer valid' });
      }

      const roles = user.userRoles.map((ur: any) => ur.role.name);
      const newPayload: JwtPayload = { sub: user.id, email: user.email, schoolId: user.schoolId, roles };
      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: this.config.get('auth.jwtRefreshSecret'),
        expiresIn: this.config.get('auth.jwtRefreshExpiry', '7d'),
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedException({ code: 'SESSION_EXPIRED', message: 'Your session has expired. Please log in again.' });
    }
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      schoolId: user.schoolId,
      roles: user.userRoles.map((ur: any) => ur.role.name),
      permissions: user.userRoles.flatMap((ur: any) =>
        ur.role.rolePermissions.map((rp: any) => `${rp.permission.resource}:${rp.permission.action}`),
      ),
    };
  }
}
