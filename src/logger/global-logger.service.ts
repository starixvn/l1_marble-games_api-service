import { Injectable, LoggerService, ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

interface SentryConfig {
  dsn: string;
  environment: string;
  release: string;
  logIdentifier: string;
}

@Injectable()
export class GlobalLoggerService extends ConsoleLogger implements LoggerService {
  private readonly config?: SentryConfig;
  constructor(
    private readonly configService: ConfigService) {
    super();
    this.config = this.configService.get<SentryConfig>('sentry');
    if (this.config) {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        maxValueLength: 5000,
        release: this.config.release ? `marble-odds-feed@${this.config.release}` : '',
      });
    }
  }

  log(message: any, context?: string) {
    super.log(message, context);
    Sentry.captureMessage(message, "info");
  }

  error(message: any, trace?: string, context?: string) {
    super.error(message, trace, context);
    Sentry.captureException(message);
  }

  warn(message: any, context?: string) {
    super.warn(message, context);
    Sentry.captureMessage(`${this.config?.logIdentifier} ${message}`, 'warning');
  }

  debug(message: any, context?: string) {
    super.debug(message, context);
    Sentry.captureMessage(`${this.config?.logIdentifier} ${message}`, 'debug');
  }

  verbose(message: any, context?: string) {
    super.verbose(message, context);
    Sentry.captureMessage(`${this.config?.logIdentifier} ${message}`, 'log');
  }
} 
