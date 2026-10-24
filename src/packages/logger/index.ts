/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Centralized Structured Telemetry & Logger
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface StructuredLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  correlationId: string;
  service: string;
  tenantId?: string;
  message: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
}

class TelemetryLogger {
  private logStore: StructuredLog[] = [];
  private readonly maxLogs: number = 2000;
  private listeners: ((log: StructuredLog) => void)[] = [];

  constructor() {
    this.info('SYSTEM', 'LogiFlow Enterprise Structured Logger Initialized');
  }

  private createLog(
    level: LogLevel,
    service: string,
    message: string,
    metadata?: Record<string, unknown>,
    correlationId?: string
  ): StructuredLog {
    const entry: StructuredLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      correlationId: correlationId || `corr_${Math.random().toString(36).substring(2, 9)}`,
      service,
      tenantId: (metadata?.tenantId as string) || 'default-tenant',
      message,
      metadata,
    };

    this.logStore.unshift(entry);
    if (this.logStore.length > this.maxLogs) {
      this.logStore.pop();
    }

    // Broadcast to live listeners
    this.listeners.forEach((listener) => {
      try {
        listener(entry);
      } catch (err) {
        console.error('Failed to notify log listener', err);
      }
    });

    // Console output with appropriate color formatting
    const prefix = `[${entry.timestamp}] [${level}] [${service}]:`;
    if (level === 'ERROR' || level === 'CRITICAL') {
      console.error(prefix, message, metadata || '');
    } else if (level === 'WARN') {
      console.warn(prefix, message, metadata || '');
    } else {
      console.log(prefix, message, metadata || '');
    }

    return entry;
  }

  public debug(service: string, message: string, metadata?: Record<string, unknown>, correlationId?: string): StructuredLog {
    return this.createLog('DEBUG', service, message, metadata, correlationId);
  }

  public info(service: string, message: string, metadata?: Record<string, unknown>, correlationId?: string): StructuredLog {
    return this.createLog('INFO', service, message, metadata, correlationId);
  }

  public warn(service: string, message: string, metadata?: Record<string, unknown>, correlationId?: string): StructuredLog {
    return this.createLog('WARN', service, message, metadata, correlationId);
  }

  public error(service: string, message: string, error?: Error | unknown, metadata?: Record<string, unknown>, correlationId?: string): StructuredLog {
    const stack = error instanceof Error ? error.stack : undefined;
    const meta = { ...metadata, errorDetails: error instanceof Error ? error.message : String(error) };
    const log = this.createLog('ERROR', service, message, meta, correlationId);
    if (stack) log.stackTrace = stack;
    return log;
  }

  public getRecentLogs(limit: number = 100, levelFilter?: LogLevel): StructuredLog[] {
    if (!levelFilter) {
      return this.logStore.slice(0, limit);
    }
    return this.logStore.filter((l) => l.level === levelFilter).slice(0, limit);
  }

  public subscribe(listener: (log: StructuredLog) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public clearLogs(): void {
    this.logStore = [];
  }
}

export const logger = new TelemetryLogger();
