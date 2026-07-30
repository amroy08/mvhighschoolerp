import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const r = exceptionResponse as Record<string, unknown>;
        message = (r.message as string) || message;
        code = (r.code as string) || this.statusToCode(status);
        details = r.details as Record<string, unknown>;

        // Handle validation errors (array of messages)
        if (Array.isArray(r.message)) {
          message = 'Validation failed';
          details = { validationErrors: r.message };
        }
      } else {
        message = exceptionResponse as string;
        code = this.statusToCode(status);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        code = 'DUPLICATE_RECORD';
        message = 'A record with this information already exists';
        details = { fields: exception.meta?.target };
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        code = 'RECORD_NOT_FOUND';
        message = 'The requested record was not found';
      } else {
        this.logger.error(`Prisma error: ${exception.code}`, exception.message);
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    // Never expose stack traces in production
    const isDev = process.env.NODE_ENV !== 'production';

    response.status(status).json({
      success: false,
      code,
      message,
      details,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(isDev && exception instanceof Error ? { stack: exception.stack } : {}),
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORISED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return map[status] ?? 'UNKNOWN_ERROR';
  }
}
