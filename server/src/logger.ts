export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

export class Logger implements ILogger {
  private format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    console.log(this.format('INFO', message, meta));
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.format('WARN', message, meta));
  }

  public error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    const errorMeta = error instanceof Error
      ? { errorMessage: error.message, stack: error.stack, ...meta }
      : error
      ? { error, ...meta }
      : meta;
    console.error(this.format('ERROR', message, errorMeta));
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      console.debug(this.format('DEBUG', message, meta));
    }
  }
}

export const logger = new Logger();
