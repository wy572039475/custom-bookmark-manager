// Database types
export interface DatabaseRow {
  id: string;
  fingerprint: string;
  category_id: string | null;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  tags: string | null;
  sort_order: number;
  visit_count: number;
  last_visited: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  fingerprint: string;
  name: string;
  color: string;
  icon: string | null;
  sort_order: number;
  created_at: Date;
}

export interface Device {
  fingerprint: string;
  username: string;
  email: string;
  sync_code: string;
  created_at: Date;
}

export interface SyncConnection {
  deviceFingerprint: string;
  syncCode: string;
}

// API Response types
export interface BookmarkResponse {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  tags: string[];
  sortOrder: number;
  visitCount: number;
  lastVisited: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryResponse {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

// Query result types
export interface QueryResult {
  rows: DatabaseRow[];
  rowsAffected: number;
  lastInsertRowid: number | bigint;
}

export type QueryParams = {
  sql: string;
  args?: any[];
}
