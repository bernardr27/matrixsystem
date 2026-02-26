/**
 * Domain Model Type Definitions
 * Business logic and entity types
 */

/**
 * Analytics Models
 */
export interface AnalyticsMetrics {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  active_users_month: number;
  total_sessions: number;
  average_session_duration_ms: number;
  bounce_rate: number;
  conversion_rate: number;
  retention_rate: number;
}

export interface UserAnalytics {
  user_id: string;
  total_sessions: number;
  total_time_spent_ms: number;
  last_active_at: string;
  features_used: Record<string, number>;
  engagement_score: number;
}

export interface EventAnalytics {
  event_type: string;
  total_events: number;
  unique_users: number;
  average_per_user: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  top_properties: Record<string, any>;
}

/**
 * Content & Document Models
 */
export interface Document {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'text' | 'markdown' | 'html' | 'code';
  status: 'draft' | 'published' | 'archived';
  version: number;
  tags: string[];
  metadata: DocumentMetadata;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface DocumentMetadata {
  word_count: number;
  read_time_minutes: number;
  is_featured: boolean;
  views: number;
  likes: number;
  comments_count: number;
  [key: string]: any;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  content: string;
  changes_summary?: string;
  created_by: string;
  created_at: string;
}

/**
 * Social & Collaboration Models
 */
export interface Comment {
  id: string;
  content_id: string;
  user_id: string;
  content: string;
  parent_id?: string; // For threaded comments
  likes: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Like {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'document' | 'comment' | 'post';
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Collaboration {
  id: string;
  document_id: string;
  user_id: string;
  role: 'viewer' | 'editor' | 'owner';
  granted_at: string;
  granted_by: string;
}

/**
 * AI/ML Models
 */
export interface AiModel {
  id: string;
  name: string;
  version: string;
  type: 'text' | 'image' | 'audio' | 'embedding' | 'other';
  provider: 'openai' | 'anthropic' | 'huggingface' | 'local' | 'custom';
  config: ModelConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModelConfig {
  api_endpoint?: string;
  api_key_ref?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  timeout_ms?: number;
  [key: string]: any;
}

export interface ModelUsage {
  id: string;
  model_id: string;
  user_id: string;
  request_tokens: number;
  response_tokens: number;
  total_tokens: number;
  cost_usd?: number;
  duration_ms: number;
  created_at: string;
}

/**
 * Organization Models
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  plan: 'free' | 'pro' | 'enterprise';
  max_members: number;
  max_projects: number;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  members: string[];
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'member' | 'lead' | 'admin';
  joined_at: string;
}

/**
 * Project & Task Models
 */
export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  owner_id: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  status: 'planning' | 'active' | 'completed';
  start_date: string;
  end_date: string;
  goal?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkItem {
  id: string;
  sprint_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee_id?: string;
  estimate_points?: number;
  actual_points?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Reporting Models
 */
export interface Report {
  id: string;
  user_id: string;
  title: string;
  type: 'analytics' | 'usage' | 'performance' | 'custom';
  filters: ReportFilter[];
  columns: string[];
  data: Record<string, any>[];
  generated_at: string;
  expires_at?: string;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'gt' | 'lt' | 'gte' | 'lte';
  value: any;
}

/**
 * Notification Models
 */
export interface NotificationPreference {
  user_id: string;
  type: string;
  enabled: boolean;
  channel: 'email' | 'push' | 'sms' | 'in_app';
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject?: string;
  template: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Audit Models
 */
export interface AuditLog {
  id: string;
  resource_type: string;
  resource_id: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'share';
  user_id: string;
  changes?: Record<string, [any, any]>; // before -> after
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Billing Models
 */
export interface Subscription {
  id: string;
  organization_id: string;
  plan: string;
  status: 'active' | 'past_due' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  organization_id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'cancelled';
  due_date: string;
  paid_at?: string;
  items: InvoiceItem[];
  created_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
}
