/**
 * HeatShield Safe Error & Performance Monitoring Logger
 * Sanitizes payloads to protect user privacy (no passwords, emails, tokens, or PII).
 */

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: 'api' | 'supabase' | 'route' | 'ai' | 'map' | 'notification' | 'general';
  message: string;
  details?: Record<string, any>;
}

const MAX_LOGS = 100;
const STORAGE_KEY = 'heatshield_diagnostics_logs';

class SafeLogger {
  private logs: LogEntry[] = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.logs = parsed.slice(-MAX_LOGS);
        }
      }
    } catch {
      this.logs = [];
    }
  }

  private saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(-MAX_LOGS)));
    } catch {
      // ignore
    }
  }

  /**
   * Redact sensitive personal keys and auth tokens from error objects
   */
  private sanitize(details?: Record<string, any>): Record<string, any> | undefined {
    if (!details || typeof details !== 'object') return undefined;

    const sanitized: Record<string, any> = {};
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'phone', 'email', 'bearer'];

    for (const [k, v] of Object.entries(details)) {
      const lowerKey = k.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[k] = '[REDACTED]';
      } else if (typeof v === 'object' && v !== null) {
        sanitized[k] = Array.isArray(v) ? `[Array(${v.length})]` : '[Object]';
      } else {
        sanitized[k] = v;
      }
    }

    return sanitized;
  }

  log(
    level: LogEntry['level'],
    category: LogEntry['category'],
    message: string,
    details?: Record<string, any>
  ) {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details: this.sanitize(details)
    };

    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.shift();
    }
    this.saveLogs();

    // Print to console in dev mode
    if (level === 'error') {
      console.error(`[HeatShield ${category.toUpperCase()}]`, message, entry.details || '');
    } else if (level === 'warn') {
      console.warn(`[HeatShield ${category.toUpperCase()}]`, message, entry.details || '');
    }
  }

  info(category: LogEntry['category'], message: string, details?: Record<string, any>) {
    this.log('info', category, message, details);
  }

  warn(category: LogEntry['category'], message: string, details?: Record<string, any>) {
    this.log('warn', category, message, details);
  }

  error(category: LogEntry['category'], message: string, details?: Record<string, any>) {
    this.log('error', category, message, details);
  }

  getRecentLogs(): LogEntry[] {
    return [...this.logs].reverse();
  }

  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export const logger = new SafeLogger();
export default logger;
