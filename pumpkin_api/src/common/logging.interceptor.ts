import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

/**
 * One structured line per request: method, path, status, cache status, duration.
 * The X-Cache value is what makes the log useful — it shows at a glance whether
 * traffic is being served from cache or is hitting Strapi.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const cache = response.getHeader('X-Cache');
          this.logger.log(
            `${request.method} ${request.originalUrl} ${response.statusCode}` +
              `${cache ? ` cache=${String(cache)}` : ''} ${Date.now() - start}ms`,
          );
        },
        error: (error: unknown) => {
          const status = error instanceof HttpException ? error.getStatus() : 500;
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `${request.method} ${request.originalUrl} ${status} ` +
              `${Date.now() - start}ms — ${message}`,
          );
        },
      }),
    );
  }
}
