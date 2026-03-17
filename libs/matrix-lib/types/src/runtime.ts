export type MatrixBridgeStatus =
  | 'pending'
  | 'executing'
  | 'executed'
  | 'completed'
  | 'failed'
  | 'silent'
  | 'processing'
  | 'verifying';

export interface MatrixCommandEnvelope {
  id: string;
  command: string;
  source: string;
  status: MatrixBridgeStatus;
  output?: string | null;
  created_at?: string;
}

export type MatrixServiceState = 'online' | 'offline' | 'degraded' | 'starting' | 'stopping' | 'unknown';

export interface MatrixHeartbeatPayload {
  timestamp: string;
  uptime: number;
  services: Record<string, MatrixServiceState>;
  meta?: Record<string, unknown>;
}
