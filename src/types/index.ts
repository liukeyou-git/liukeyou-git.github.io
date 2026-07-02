export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  bio?: string;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  description?: string;
  tags: string[];
  cover_url?: string;
  status: 'draft' | 'published';
  published_at?: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id?: string;
  content: string;
  parent_id?: string;
  likes: number;
  status: 'pending' | 'approved';
  created_at: string;
  author?: User;
  replies?: Comment[];
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
}

export interface CommentFormData {
  content: string;
}