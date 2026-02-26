/**
 * Authentication & Authorization Type Definitions
 */

/**
 * Auth Provider Types
 */
export type AuthProvider = 'email' | 'google' | 'discord' | 'github' | 'magic_link';

/**
 * Auth State
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: AuthError | null;
}

export interface AuthUser {
  id: string;
  email: string;
  email_verified: boolean;
  phone?: string;
  phone_verified?: boolean;
  user_metadata: UserMetadata;
  app_metadata?: AppMetadata;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
}

export interface UserMetadata {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  provider?: AuthProvider;
  [key: string]: any;
}

export interface AppMetadata {
  provider?: string;
  providers?: string[];
  roles?: string[];
  groups?: string[];
  [key: string]: any;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  expires_at?: number;
  token_type: 'Bearer';
  user: AuthUser;
}

/**
 * Auth Errors
 */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'EMAIL_NOT_CONFIRMED'
  | 'ACCOUNT_LOCKED'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'SESSION_EXPIRED'
  | 'PERMISSION_DENIED'
  | 'PROVIDER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Login/Signup Requests
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
  metadata?: UserMetadata;
}

export interface OAuthRequest {
  provider: AuthProvider;
  redirect_to?: string;
  scopes?: string[];
}

export interface MagicLinkRequest {
  email: string;
  redirect_to?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  old_password: string;
  new_password: string;
  token?: string;
}

export interface VerifyEmailRequest {
  token: string;
  email?: string;
}

/**
 * Permission & Role Management
 */
export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface RoleAssignment {
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by?: string;
}

/**
 * JWT Payload
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  email_verified?: boolean;
  iat: number; // Issued at
  exp: number; // Expiration
  aud?: string; // Audience
  iss?: string; // Issuer
  roles?: string[];
  permissions?: string[];
  [key: string]: any;
}

/**
 * Auth Context
 */
export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (request: SignupRequest) => Promise<void>;
  signout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  updatePassword: (request: UpdatePasswordRequest) => Promise<void>;
}

/**
 * Protected Route Config
 */
export interface ProtectedRoute {
  path: string;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  redirectTo?: string;
}

/**
 * API Key Management
 */
export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key: string; // Hashed
  preview: string; // First 8 chars
  scopes?: string[];
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyCreateRequest {
  name: string;
  scopes?: string[];
  expires_in_days?: number;
}

export interface ApiKeyCreateResponse {
  id: string;
  key: string; // Only shown once
  name: string;
  preview: string;
}

/**
 * Two-Factor Authentication
 */
export interface TwoFactorConfig {
  enabled: boolean;
  method: 'totp' | 'sms' | 'email';
  verified: boolean;
  created_at: string;
}

export interface TwoFactorChallenge {
  id: string;
  user_id: string;
  method: string;
  verified: boolean;
  created_at: string;
  expires_at: string;
}

export interface TwoFactorVerifyRequest {
  code: string;
  backup_code?: string;
}
