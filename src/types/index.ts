import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export interface ProductFilter {
  category?: string;
  brand?: string;
  type?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}
