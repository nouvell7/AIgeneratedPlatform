import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { AuthService } from '../services/auth.service';
import { validateRequest } from '../lib/validation';
import { loginSchema, registerSchema } from '@shared/schemas';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Additional validation schemas for auth endpoints
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

@injectable()
export class AuthController {
  constructor(@inject(AuthService) private authService: AuthService) {}

  /**
   * Register a new user
   * POST /auth/register
   */
  register = [
    validateRequest({ body: registerSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await this.authService.register(req.body);

        res.status(201).json({
          success: true,
          data: {
            user: result.user,
            tokens: result.tokens,
          },
          message: 'User registered successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Login user
   * POST /auth/login
   */
  login = [
    validateRequest({ body: loginSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await this.authService.login(req.body);

        res.json({
          success: true,
          data: {
            user: result.user,
            tokens: result.tokens,
          },
          message: 'Login successful',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  refresh = [
    validateRequest({ body: refreshTokenSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { refreshToken } = req.body;
        const tokens = await this.authService.refreshToken(refreshToken);

        res.json({
          success: true,
          data: { tokens },
          message: 'Token refreshed successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get current user profile
   * GET /auth/profile
   */
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_001',
            message: 'Authentication required',
          },
        });
      }

      const user = await this.authService.getUserProfile(userId);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user profile
   * PUT /auth/profile
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_001',
            message: 'Authentication required',
          },
        });
      }

      const user = await this.authService.updateProfile(userId, req.body);

      res.json({
        success: true,
        data: { user },
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change password
   * POST /auth/change-password
   */
  changePassword = [
    validateRequest({ body: changePasswordSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const { currentPassword, newPassword } = req.body;
        await this.authService.changePassword(userId, currentPassword, newPassword);

        res.json({
          success: true,
          message: 'Password changed successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Delete user account
   * DELETE /auth/account
   */
  deleteAccount = [
    validateRequest({ body: deleteAccountSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        const { password } = req.body;
        await this.authService.deleteAccount(userId, password);

        res.json({
          success: true,
          message: 'Account deleted successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Logout user (client-side token removal)
   * POST /auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (userId) {
        logger.info(`User logout: ${userId}`);
      }

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  };
}
