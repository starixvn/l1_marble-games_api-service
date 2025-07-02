import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DatabaseLogService } from './database-logger.service';
import { extractGameId, extractRoundId } from '../utils/event-id';

// Define the user interface based on what JWT strategy returns
interface AuthenticatedUser {
  userId: string;
  username: string;
}

// Extend Express Request to include the user property
interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(
    @Inject(DatabaseLogService)
    private readonly databaseLogService: DatabaseLogService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        this.log(request, response, data, startTime);
      }),
    );
  }

  private async log(
    request: AuthenticatedRequest,
    response: Response,
    data: any,
    startTime: number,
  ) {
    try {

      const additionalInfo = request.query.eventID ? {
        eventId: request.query.eventID ? Number(request.query.eventID) : undefined,
        gameId: request.query.eventID ? extractGameId(Number(request.query.eventID)) : undefined,
        roundId: request.query.eventID ? extractRoundId(Number(request.query.eventID)) : undefined,
      } : undefined;


      const duration = Date.now() - startTime;
      const logRecord = {
        user: request.user,
        request: {
          method: request.method,
          path: request.path,
          query: request.query,
          body: request.body,
          additionalInfo,
        },
        response: {
          statusCode: response.statusCode,
          responseBody: data,
          responseTime: `${duration}ms`,
        },
      };
      this.databaseLogService.insertLog(logRecord);
    } catch {}
  }
}
