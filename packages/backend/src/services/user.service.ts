import { injectable } from 'tsyringe';
import { prisma } from '../lib/prisma';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { loggers } from '../utils/logger';
import { User, Prisma } from '@prisma/client'; // Import User and Prisma types

export interface UpdateProfileData {
  username?: string;
  profileImage?: string | null;
}

export interface UserStats {
  totalProjects: number;
  deployedProjects: number;
  totalRevenue: number;
  communityPosts: number;
  communityVotes: number;
  // Add more stats as needed
}

@injectable()
export class UserService {
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

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get public user profile (limited information)
   */
  async getPublicProfile(userId: string): Promise<{
    id: string;
    username: string;
    profileImage?: string | null;
    createdAt: Date;
    stats: UserStats;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        profileImage: true,
        createdAt: true,
        settings: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Check if profile is public
    const settings = user.settings ? JSON.parse(user.settings) : {};
    if (!settings?.privacy?.profilePublic) {
      throw new NotFoundError('User profile is private');
    }

    // Get user statistics
    const stats = await this.getUserStats(userId);

    return {
      id: user.id,
      username: user.username,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      stats,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileData
  ): Promise<Omit<User, 'passwordHash'>> {
    // Validate username uniqueness if provided
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

    // Validate profile image URL if provided
    if (data.profileImage) {
      try {
        new URL(data.profileImage);
      } catch {
        throw new ValidationError('Invalid profile image URL');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        username: data.username?.toLowerCase(),
        updatedAt: new Date(),
      },
    });

    loggers.business.projectCreated(userId, 'profile_updated');

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(
    userId: string,
    imageUrl: string
  ): Promise<Omit<User, 'passwordHash'>> {
    // Validate image URL
    try {
      new URL(imageUrl);
    } catch {
      throw new ValidationError('Invalid image URL');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: imageUrl,
        updatedAt: new Date(),
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    const [
      totalProjects,
      deployedProjects,
      communityPosts,
      communityVotes,
    ] = await Promise.all([
      // Total projects count
      prisma.project.count({
        where: { userId },
      }),

      // Deployed projects count
      prisma.project.count({
        where: {
          userId,
          status: 'DEPLOYED',
        },
      }),

      // Community posts count
      prisma.communityPost.count({
        where: { userId },
      }),

      // Community votes received count
      prisma.vote.count({
        where: {
          OR: [
            {
              post: {
                userId,
              },
            },
            {
              comment: {
                userId,
              },
            },
          ],
        },
      }),
    ]);

    // Calculate total revenue (placeholder - would integrate with actual revenue data)
    const totalRevenue = 0; // TODO: Implement actual revenue calculation

    return {
      totalProjects,
      deployedProjects,
      totalRevenue,
      communityPosts,
      communityVotes,
    };
  }

  /**
   * Search users by username
   */
  async searchUsers(
    query: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    users: Array<{
      id: string;
      username: string;
      profileImage?: string | null;
      createdAt: Date;
    }>;
    total: number;
  }> {
    // Prisma doesn't directly support JSON path filters in where clause for String fields
    // We'll fetch all users and filter in memory, or use raw SQL if performance is critical
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        profileImage: true,
        createdAt: true,
        settings: true,
      },
      orderBy: {
        username: 'asc',
      }
    });

    const filteredUsers = allUsers.filter(user => {
      const settings = user.settings ? JSON.parse(user.settings) : {};
      const isPublicProfile = settings?.privacy?.profilePublic === true;
      const matchesQuery = user.username.toLowerCase().includes(query.toLowerCase());
      return isPublicProfile && matchesQuery;
    });

    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return { users: paginatedUsers, total: filteredUsers.length };
  }

  /**
   * Get user activity feed
   */
  async getUserActivity(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Array<{
    id: string;
    type: string; // Changed to string to be more flexible
    title: string;
    description?: string;
    createdAt: Date;
    metadata?: Record<string, any>;
  }>> {
    // Get recent projects
    const projects = await prisma.project.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(limit / 2),
    });

    // Get recent community posts
    const posts = await prisma.communityPost.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(limit / 2),
    });

    // Combine and format activities
    const activities = [
      ...projects.map(project => ({
        id: project.id,
        type: project.status === 'DEPLOYED' ? 'project_deployed' : 'project_created' as const,
        title: project.name,
        description: `Project ${project.status.toLowerCase()}`,
        createdAt: project.status === 'DEPLOYED' ? project.updatedAt : project.createdAt,
        metadata: { projectId: project.id, status: project.status },
      })),
      ...posts.map(post => ({
        id: post.id,
        type: 'post_created' as const,
        title: post.title,
        description: `${post.type} post created`,
        createdAt: post.createdAt,
        metadata: { postId: post.id, postType: post.type },
      })),
    ];

    // Sort by date and apply pagination
    return activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  /**
   * Delete user account and all related data
   */
  async deleteUserAccount(userId: string): Promise<void> {
    // This will cascade delete all related records due to Prisma schema constraints
    await prisma.user.delete({
      where: { id: userId },
    });

    loggers.business.projectCreated(userId, 'account_deleted');
  }

  /**
   * Get users leaderboard
   */
  async getLeaderboard(
    type: 'projects' | 'revenue' | 'community',
    limit: number = 10
  ): Promise<Array<{
    user: {
      id: string;
      username: string;
      profileImage?: string | null;
    };
    score: number;
    rank: number;
  }>> {
    switch (type) {
      case 'projects':
        // Order by number of deployed projects
        const projectCounts = await prisma.user.findMany({
          select: {
            id: true,
            username: true,
            profileImage: true,
            _count: {
              select: {
                projects: {
                  where: { status: 'DEPLOYED' },
                },
              },
            },
            settings: true, // Select settings to filter by profilePublic
          },
          where: {
            // Filter by profilePublic in memory if direct JSON filter is not supported
          },
          orderBy: {
            projects: {
              _count: 'desc',
            },
          },
          take: limit,
        });

        // Filter in memory for profilePublic
        const filteredProjectCounts = projectCounts.filter(user => {
          const settings = user.settings ? JSON.parse(user.settings) : {};
          return settings?.privacy?.profilePublic === true;
        });

        return filteredProjectCounts.map((user, index) => ({
          user: {
            id: user.id,
            username: user.username,
            profileImage: user.profileImage,
          },
          score: user._count.projects,
          rank: index + 1,
        }));

      case 'community':
        // Order by community engagement (posts + votes)
        const communityScores = await prisma.user.findMany({
          select: {
            id: true,
            username: true,
            profileImage: true,
            _count: {
              select: {
                posts: true,
                votes: true,
              },
            },
            settings: true, // Select settings to filter by profilePublic
          },
          where: {
            // Filter by profilePublic in memory
          },
          take: limit,
        });

        // Filter in memory for profilePublic
        const filteredCommunityScores = communityScores.filter(user => {
          const settings = user.settings ? JSON.parse(user.settings) : {};
          return settings?.privacy?.profilePublic === true;
        });

        return filteredCommunityScores
          .map(user => ({
            user: {
              id: user.id,
              username: user.username,
              profileImage: user.profileImage,
            },
            score: user._count.posts + user._count.votes,
            rank: 0, // Will be set below
          }))
          .sort((a, b) => b.score - a.score)
          .map((user, index) => ({ ...user, rank: index + 1 }))
          .slice(0, limit);

      default:
        return [];
    }
  }
}
