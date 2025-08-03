import axios from 'axios';
import { prisma } from '../lib/prisma';
import { JWTService, TokenPair } from '../utils/jwt';
import { AuthenticationError, ExternalServiceError } from '../utils/errors';
import { loggers } from '../utils/logger';
import { User } from '@prisma/client';

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export interface GitHubUserInfo {
  id: number;
  login: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface OAuthResult {
  user: Omit<User, 'passwordHash'>;
  tokens: TokenPair;
  isNewUser: boolean;
}

export class OAuthService {
  /**
   * Handle Google OAuth login
   */
  static async handleGoogleLogin(accessToken: string): Promise<OAuthResult> {
    try {
      // Get user info from Google
      const userInfo = await this.getGoogleUserInfo(accessToken);

      if (!userInfo.verified_email) {
        throw new AuthenticationError('Google email not verified');
      }

      // Find or create user
      const result = await this.findOrCreateGoogleUser(userInfo);

      // Generate JWT tokens
      const tokens = JWTService.generateTokenPair({
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
      });

      // Log login
      loggers.auth.login(result.user.id, 'google');

      return {
        user: result.user,
        tokens,
        isNewUser: result.isNewUser,
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      loggers.external.error('google', '/oauth/userinfo', error as Error);
      throw new ExternalServiceError('google', 'Failed to authenticate with Google');
    }
  }

  /**
   * Handle GitHub OAuth login
   */
  static async handleGitHubLogin(accessToken: string): Promise<OAuthResult> {
    try {
      // Get user info from GitHub
      const userInfo = await this.getGitHubUserInfo(accessToken);

      if (!userInfo.email) {
        throw new AuthenticationError('GitHub email not available');
      }

      // Find or create user
      const result = await this.findOrCreateGitHubUser(userInfo);

      // Generate JWT tokens
      const tokens = JWTService.generateTokenPair({
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
      });

      // Log login
      loggers.auth.login(result.user.id, 'github');

      return {
        user: result.user,
        tokens,
        isNewUser: result.isNewUser,
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      loggers.external.error('github', '/user', error as Error);
      throw new ExternalServiceError('github', 'Failed to authenticate with GitHub');
    }
  }

  /**
   * Get user info from Google
   */
  private static async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 10000,
    });

    return response.data;
  }

  /**
   * Get user info from GitHub
   */
  private static async getGitHubUserInfo(accessToken: string): Promise<GitHubUserInfo> {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
      timeout: 10000,
    });

    return response.data;
  }

  /**
   * Find or create user from Google info
   */
  private static async findOrCreateGoogleUser(userInfo: GoogleUserInfo): Promise<{
    user: Omit<User, 'passwordHash'>;
    isNewUser: boolean;
  }> {
    // Try to find existing user by Google ID
    let user = await prisma.user.findUnique({
      where: { googleId: userInfo.id },
    });

    if (user) {
      // Update user info if needed
      if (user.email !== userInfo.email || user.profileImage !== userInfo.picture) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            email: userInfo.email.toLowerCase(),
            profileImage: userInfo.picture,
            updatedAt: new Date(),
          },
        });
      }

      const { passwordHash: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, isNewUser: false };
    }

    // Try to find existing user by email
    user = await prisma.user.findUnique({
      where: { email: userInfo.email.toLowerCase() },
    });

    if (user) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: userInfo.id,
          profileImage: userInfo.picture || user.profileImage,
          updatedAt: new Date(),
        },
      });

      const { passwordHash: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, isNewUser: false };
    }

    // Create new user
    const username = await this.generateUniqueUsername(userInfo.name || userInfo.email.split('@')[0]);
    
    user = await prisma.user.create({
      data: {
        email: userInfo.email.toLowerCase(),
        username,
        googleId: userInfo.id,
        profileImage: userInfo.picture,
        role: 'USER',
        settings: {
          notifications: { email: true, push: true },
          privacy: { profilePublic: true, projectsPublic: true },
        },
      },
    });

    // Log registration
    loggers.auth.register(user.id, 'google');

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, isNewUser: true };
  }

  /**
   * Find or create user from GitHub info
   */
  private static async findOrCreateGitHubUser(userInfo: GitHubUserInfo): Promise<{
    user: Omit<User, 'passwordHash'>;
    isNewUser: boolean;
  }> {
    // Try to find existing user by GitHub ID
    let user = await prisma.user.findUnique({
      where: { githubId: userInfo.id.toString() },
    });

    if (user) {
      // Update user info if needed
      if (user.email !== userInfo.email || user.profileImage !== userInfo.avatar_url) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            email: userInfo.email.toLowerCase(),
            profileImage: userInfo.avatar_url,
            updatedAt: new Date(),
          },
        });
      }

      const { passwordHash: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, isNewUser: false };
    }

    // Try to find existing user by email
    user = await prisma.user.findUnique({
      where: { email: userInfo.email.toLowerCase() },
    });

    if (user) {
      // Link GitHub account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          githubId: userInfo.id.toString(),
          profileImage: userInfo.avatar_url || user.profileImage,
          updatedAt: new Date(),
        },
      });

      const { passwordHash: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, isNewUser: false };
    }

    // Create new user
    const username = await this.generateUniqueUsername(userInfo.name || userInfo.login);
    
    user = await prisma.user.create({
      data: {
        email: userInfo.email.toLowerCase(),
        username,
        githubId: userInfo.id.toString(),
        profileImage: userInfo.avatar_url,
        role: 'USER',
        settings: {
          notifications: { email: true, push: true },
          privacy: { profilePublic: true, projectsPublic: true },
        },
      },
    });

    // Log registration
    loggers.auth.register(user.id, 'github');

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, isNewUser: true };
  }

  /**
   * Generate unique username
   */
  private static async generateUniqueUsername(baseName: string): Promise<string> {
    // Clean base name
    let username = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    if (username.length < 3) {
      username = 'user' + username;
    }

    // Check if username is available
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!existingUser) {
      return username;
    }

    // Generate unique username with number suffix
    let counter = 1;
    let uniqueUsername = `${username}${counter}`;

    while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
      counter++;
      uniqueUsername = `${username}${counter}`;
    }

    return uniqueUsername;
  }

  /**
   * Unlink OAuth account
   */
  static async unlinkOAuthAccount(
    userId: string,
    provider: 'google' | 'github'
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if user has password or other OAuth method
    const hasPassword = !!user.passwordHash;
    const hasGoogle = !!user.googleId;
    const hasGitHub = !!user.githubId;

    if (!hasPassword && ((provider === 'google' && !hasGitHub) || (provider === 'github' && !hasGoogle))) {
      throw new AuthenticationError('Cannot unlink the only authentication method');
    }

    // Unlink account
    const updateData = provider === 'google' 
      ? { googleId: null }
      : { githubId: null };

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    loggers.auth.oauthUnlink(userId, provider);
  }
}

export default OAuthService;
