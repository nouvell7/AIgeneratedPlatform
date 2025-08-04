import { injectable } from 'tsyringe';
import { prisma } from '../lib/prisma';
import { JWTService, TokenPair } from '../utils/jwt';
import { PasswordService } from '../utils/password';
import { 
  AuthenticationError, 
  ConflictError, 
  ValidationError,
  NotFoundError 
} from '../utils/errors';
import { loggers } from '../utils/logger';
import { User } from '@prisma/client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  tokens: TokenPair;
}

@injectable()
export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResult> {
    const { email, username, password } = data;

    // Validate password strength
    const passwordValidation = PasswordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError('Password does not meet requirements', {
        errors: passwordValidation.errors,
        score: passwordValidation.score,
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
      throw new ConflictError(`User with this ${field} already exists`, { field });
    }

    // Hash password
    const passwordHash = await PasswordService.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        role: 'USER',
        settings: JSON.stringify({
          notifications: { email: true, push: true },
          privacy: { profilePublic: true, projectsPublic: true },
        }),
      },
    });

    // Generate tokens
    const tokens = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Log registration
    loggers.auth.register(user.id, 'email');

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { email, password } = credentials;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await PasswordService.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const tokens = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Log login
    loggers.auth.login(user.id, 'email');

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token
    const payload = JWTService.verifyRefreshToken(refreshToken);

    // Find user to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Generate new token pair
    const tokens = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return tokens;
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string, 
    data: Partial<Pick<User, 'username' | 'profileImage' | 'settings'>>
  ): Promise<Omit<User, 'passwordHash'>> {
    // If username is being updated, check for conflicts
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username.toLowerCase(),
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictError('Username already taken', { field: 'username' });
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        username: data.username?.toLowerCase(),
        updatedAt: new Date(),
      } as any,
    });

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isCurrentPasswordValid = await PasswordService.verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Validate new password strength
    const passwordValidation = PasswordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new ValidationError('New password does not meet requirements', {
        errors: passwordValidation.errors,
        score: passwordValidation.score,
      });
    }

    // Hash new password
    const newPasswordHash = await PasswordService.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    loggers.auth.passwordChange(userId);
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundError('User');
    }

    // Verify password
    const isPasswordValid = await PasswordService.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Password is incorrect');
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    loggers.business.projectCreated(userId, 'account_deleted');
  }

  /**
   * Validate user permissions
   */
  async validateUserPermissions(
    userId: string,
    requiredRole: 'USER' | 'ADMIN' = 'USER'
  ): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
      throw new AuthenticationError('Admin access required');
    }

    return user;
  }
}
