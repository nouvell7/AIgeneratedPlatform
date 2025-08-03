import jwt from 'jsonwebtoken';
import { TokenExpiredError, AuthenticationError } from './errors';
import { logger } from './logger';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!;
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;
  private static readonly ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  /**
   * Generate access token
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
        expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
        issuer: 'ai-platform',
        audience: 'ai-platform-users',
      } as jwt.SignOptions);
    } catch (error) {
      logger.error('Failed to generate access token:', error);
      throw new AuthenticationError('Token generation failed');
    }
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
        expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
        issuer: 'ai-platform',
        audience: 'ai-platform-users',
      } as jwt.SignOptions);
    } catch (error) {
      logger.error('Failed to generate refresh token:', error);
      throw new AuthenticationError('Token generation failed');
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  static generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
        issuer: 'ai-platform',
        audience: 'ai-platform-users',
      }) as JWTPayload;

      return decoded;
    } catch (error: any) {
      logger.warn('Access token verification failed:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredError('Access token has expired');
      }
      
      throw new AuthenticationError('Invalid access token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
        issuer: 'ai-platform',
        audience: 'ai-platform-users',
      }) as JWTPayload;

      return decoded;
    } catch (error: any) {
      logger.warn('Refresh token verification failed:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredError('Refresh token has expired');
      }
      
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded || !decoded.exp) {
        return null;
      }
      
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return true;
    }
    
    return expiration < new Date();
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }
}

export default JWTService;