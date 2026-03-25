export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface Device {
  fingerprint: string;
  username: string;
  email: string;
  syncCode?: string;
  createdAt: string;
}

export interface SyncData {
  mainDevice: Device;
  linkedDevices: Device[];
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color?: string;
  icon?: string;
  sortOrder: number;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  categoryId?: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  tags: string[];
  sortOrder: number;
  visitCount: number;
  lastVisited?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}
