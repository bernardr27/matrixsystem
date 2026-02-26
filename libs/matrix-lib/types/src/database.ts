/**
 * Database Type Definitions
 * Shared across all Matrix applications
 */

/**
 * User Authentication & Profiles
 */
export interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  status?: 'online' | 'offline' | 'idle' | 'busy';
  created_at: string;
  updated_at: string;
}

/**
 * Sessions & Tokens
 */
export interface DatabaseAuthSession {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: User;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  token: string;
  device_info?: string;
  ip_address?: string;
  expires_at: string;
  created_at: string;
  last_activity_at: string;
}

/**
 * Data Records & Collections
 */
export interface BaseRecord {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface DataRecord extends BaseRecord {
  type: string;
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  is_public?: boolean;
}

export interface JournalEntry extends BaseRecord {
  title: string;
  content: string;
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  tags?: string[];
  is_draft: boolean;
}

export interface Insight extends BaseRecord {
  type: 'pattern' | 'trend' | 'recommendation' | 'alert';
  title: string;
  description: string;
  data: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_actionable: boolean;
}

export interface Task extends BaseRecord {
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
  tags?: string[];
}

/**
 * Relationships & Connections
 */
export interface Relationship extends BaseRecord {
  from_id: string;
  to_id: string;
  type: string;
  weight?: number;
  metadata?: Record<string, any>;
}

export interface Pattern extends BaseRecord {
  name: string;
  category: string;
  description?: string;
  frequency: number;
  last_occurred_at: string;
  confidence: number; // 0-100
  is_positive: boolean;
}

/**
 * Analytics & Metrics
 */
export interface AnalyticsEvent extends BaseRecord {
  event_type: string;
  event_name: string;
  properties?: Record<string, any>;
  timestamp: string;
}

export interface Metric extends BaseRecord {
  name: string;
  value: number;
  unit?: string;
  timestamp: string;
  category?: string;
}

export interface SystemHealth extends BaseRecord {
  service_name: string;
  status: 'healthy' | 'degraded' | 'down';
  response_time_ms?: number;
  error_count?: number;
  last_check_at: string;
}

/**
 * Files & Attachments
 */
export interface Attachment extends BaseRecord {
  filename: string;
  mimetype: string;
  size: number; // in bytes
  storage_path: string;
  is_public: boolean;
  expires_at?: string;
}

export interface FileRecord extends BaseRecord {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  mimetype?: string;
  parent_id?: string;
}

/**
 * Notifications & Messages
 */
export interface Notification extends BaseRecord {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  data?: Record<string, any>;
  action_url?: string;
  expires_at?: string;
}

export interface Message extends BaseRecord {
  from_id: string;
  to_id: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  thread_id?: string;
  attachments?: string[];
}

/**
 * Settings & Preferences
 */
export interface UserSettings extends BaseRecord {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  timezone?: string;
  notifications_enabled: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  preferences: Record<string, any>;
}

export interface Feature extends BaseRecord {
  name: string;
  key: string;
  enabled: boolean;
  description?: string;
  config?: Record<string, any>;
}

/**
 * Database Query Results
 */
export interface QueryResult<T> {
  data: T[] | null;
  error: Error | null;
  status: number;
  statusText: string;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Real-time Subscription Payload
 */
export interface RealtimePayload<T> {
  new: T | null;
  old: T | null;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  commit_timestamp: string;
  errors: string[] | null;
}
