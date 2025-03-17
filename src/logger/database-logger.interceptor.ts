import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from "@nestjs/common";
import { Request, Response } from 'express';
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { DatabaseLogService } from "./database-logger.service";

@Injectable()
export class LoggerInterceptor implements NestInterceptor {

  constructor(
    @Inject(DatabaseLogService) 
    private readonly databaseLogService: DatabaseLogService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        this.log(request, response, data, startTime);
      }),
    );
  }

  private async log(request: Request, response: Response, data: any, startTime: number) {
    try {
      const duration = Date.now() - startTime;
      const logRecord = {
        request: {
          method: request.method,
          url: request.url,
          body: request.body,
        },
        response: {
          statusCode: response.statusCode,
          responseBody: data,
          responseTime: `${duration}ms`
        }
      };
      this.databaseLogService.insertLog(logRecord);
    } catch {

    }
  }
}
