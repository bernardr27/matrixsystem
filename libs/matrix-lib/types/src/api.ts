/**
 * API Type Definitions
 * Shared request/response types for Matrix API endpoints
 */

/**
 * API Response Wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ResponseMeta {
  timestamp: string;
  version: string;
  request_id?: string;
  elapsed_ms?: number;
}

/**
 * Pagination
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * API Request Types
 */
export interface CreateRequest<T> {
  data: T;
}

export interface UpdateRequest<T> {
  id: string;
  data: Partial<T>;
}

export interface DeleteRequest {
  id: string;
}

export interface BulkRequest<T> {
  items: T[];
}

/**
 * Health & Status
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  timestamp: string;
  uptime_ms: number;
  services: Record<string, ServiceStatus>;
}

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'down';
  response_time_ms: number;
  last_check: string;
  error?: string;
}

/**
 * Search & Filter
 */
export interface SearchQuery {
  q: string;
  type?: string;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface SearchResult<T> {
  query: string;
  results: T[];
  total: number;
  took_ms: number;
}

/**
 * Batch Operations
 */
export interface BatchOperation<T> {
  id: string;
  operation: 'create' | 'update' | 'delete';
  data: T;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface BatchResult<T> {
  total: number;
  successful: number;
  failed: number;
  operations: BatchOperation<T>[];
}

/**
 * Webhook Payload
 */
export interface WebhookPayload<T = any> {
  id: string;
  event: string;
  timestamp: string;
  data: T;
  retry_count?: number;
  signature?: string;
}

/**
 * AI/LLM Request Types
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ChatResponse {
  id: string;
  model: string;
  message: ChatMessage;
  finish_reason: 'stop' | 'length' | 'error';
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * File Upload
 */
export interface FileUploadRequest {
  file: File | Blob;
  filename: string;
  mimetype: string;
  size: number;
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  id: string;
  url: string;
  path: string;
  size: number;
  mimetype: string;
  created_at: string;
}

/**
 * Error Responses
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationErrorResponse {
  code: string;
  message: string;
  errors: ValidationError[];
}

export interface NotFoundError {
  code: 'NOT_FOUND';
  resource: string;
  id: string;
}

export interface UnauthorizedError {
  code: 'UNAUTHORIZED';
  reason: string;
}

export interface RateLimitError {
  code: 'RATE_LIMITED';
  retry_after: number;
  limit: number;
  remaining: number;
}
