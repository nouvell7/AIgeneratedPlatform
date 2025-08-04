import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { OAuthService } from '../services/oauth.service';
import { validateRequest } from '../lib/validation';
import { z } from 'zod';

// Validation schemas for OAuth endpoints
const oauthTokenSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
});

const unlinkAccountSchema = z.object({
  provider: z.enum(['google', 'github'], {
    errorMap: () => ({ message: 'Provider must be either google or github' }),
  }),
});

@injectable()
export class OAuthController {
  constructor(@inject(OAuthService) private oauthService: OAuthService) {}

  /**
   * Handle Google OAuth login
   * POST /auth/oauth/google
   */
  googleLogin = [
    validateRequest({ body: oauthTokenSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { accessToken } = req.body;
        const result = await this.oauthService.handleGoogleLogin(accessToken);

        res.json({
          success: true,
          data: {
            user: result.user,
            tokens: result.tokens,
            isNewUser: result.isNewUser,
          },
          message: result.isNewUser ? 'Account created successfully' : 'Login successful',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Handle GitHub OAuth login
   * POST /auth/oauth/github
   */
  githubLogin = [
    validateRequest({ body: oauthTokenSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { accessToken } = req.body;
        const result = await this.oauthService.handleGitHubLogin(accessToken);

        res.json({
          success: true,
          data: {
            user: result.user,
            tokens: result.tokens,
            isNewUser: result.isNewUser,
          },
          message: result.isNewUser ? 'Account created successfully' : 'Login successful',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Unlink OAuth account
   * DELETE /auth/oauth/unlink
   */
  unlinkAccount = [
    validateRequest({ body: unlinkAccountSchema }),
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

        const { provider } = req.body;
        await this.oauthService.unlinkOAuthAccount(userId, provider);

        res.json({
          success: true,
          message: `${provider} account unlinked successfully`,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get OAuth connection status
   * GET /auth/oauth/status
   */
  getConnectionStatus = async (req: Request, res: Response, next: NextFunction) => {
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

      // This would typically be handled by the AuthService
      // For now, we'll return a placeholder response
      res.json({
        success: true,
        data: {
          google: false, // Would check if user.googleId exists
          github: false, // Would check if user.githubId exists
          hasPassword: true, // Would check if user.passwordHash exists
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
