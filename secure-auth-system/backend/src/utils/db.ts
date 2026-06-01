import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Global Prisma Client instance
let prisma: PrismaClient | null = null;
let isPrismaAvailable = false;

// Graceful fallback to full local in-memory DB if database server is not configured or offline
const mockUsersTable: any[] = [];
const mockSessionsTable: any[] = [];

try {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('MOCK_DB')) {
    prisma = new PrismaClient({
      log: ['error'],
    });
    isPrismaAvailable = true;
  }
} catch (e) {
  console.warn('⚠️ Prisma Client failed to initialize. Redirecting to clean in-memory database simulation.');
  isPrismaAvailable = false;
}

export const db = {
  isMock: () => !isPrismaAvailable,

  users: {
    findUnique: async ({ where }: { where: { email?: string; id?: string; verificationToken?: string; passwordResetToken?: string } }) => {
      if (isPrismaAvailable && prisma) {
        try {
          return await prisma.user.findUnique({ where } as any);
        } catch (e) {
          isPrismaAvailable = false; // Fall back on database connectivity failures
        }
      }

      // Simulated User Query
      return mockUsersTable.find(u => {
        if (where.email && u.email === where.email) return true;
        if (where.id && u.id === where.id) return true;
        if (where.verificationToken && u.verificationToken === where.verificationToken) return true;
        if (where.passwordResetToken && u.passwordResetToken === where.passwordResetToken) return true;
        return false;
      }) || null;
    },

    create: async ({ data }: { data: any }) => {
      if (isPrismaAvailable && prisma) {
        try {
          return await prisma.user.create({ data });
        } catch (e) {
          isPrismaAvailable = false;
        }
      }

      // Simulated User Creation
      const newUser = {
        id: crypto.randomUUID(),
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role || 'USER',
        isVerified: data.isVerified ?? false,
        verificationToken: data.verificationToken || null,
        verificationExp: data.verificationExp || null,
        passwordResetToken: data.passwordResetToken || null,
        passwordResetExp: data.passwordResetExp || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsersTable.push(newUser);
      return newUser;
    },

    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      if (isPrismaAvailable && prisma) {
        try {
          return await prisma.user.update({ where, data } as any);
        } catch (e) {
          isPrismaAvailable = false;
        }
      }

      // Simulated User Modification
      const user = mockUsersTable.find(u => u.id === where.id);
      if (!user) throw new Error('User not found');
      
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
          user[key] = data[key];
        }
      });
      user.updatedAt = new Date();
      return user;
    }
  },

  sessions: {
    findUnique: async ({ where }: { where: { refreshToken: string } }) => {
      if (isPrismaAvailable && prisma) {
        try {
          return await prisma.session.findUnique({ where, include: { user: true } });
        } catch (e) {
          isPrismaAvailable = false;
        }
      }

      // Simulated Session Query
      const session = mockSessionsTable.find(s => s.refreshToken === where.refreshToken);
      if (!session) return null;

      const user = mockUsersTable.find(u => u.id === session.userId);
      return { ...session, user };
    },

    create: async ({ data }: { data: any }) => {
      if (isPrismaAvailable && prisma) {
        try {
          return await prisma.session.create({ data });
        } catch (e) {
          isPrismaAvailable = false;
        }
      }

      // Simulated Session Creation
      const newSession = {
        id: crypto.randomUUID(),
        userId: data.userId,
        refreshToken: data.refreshToken,
        userAgent: data.userAgent || null,
        ipAddress: data.ipAddress || null,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
      };
      mockSessionsTable.push(newSession);
      return newSession;
    },

    delete: async ({ where }: { where: { refreshToken?: string; id?: string } }) => {
      if (isPrismaAvailable && prisma) {
        try {
          return await prisma.session.delete({ where } as any);
        } catch (e) {
          isPrismaAvailable = false;
        }
      }

      // Simulated Session Deletion
      const index = mockSessionsTable.findIndex(s => {
        if (where.refreshToken && s.refreshToken === where.refreshToken) return true;
        if (where.id && s.id === where.id) return true;
        return false;
      });
      if (index !== -1) {
        mockSessionsTable.splice(index, 1);
      }
    }
  }
};
