import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { OrderNotFoundError } from '../core/errors';

@Catch(OrderNotFoundError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: OrderNotFoundError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(HttpStatus.NOT_FOUND).json({
      statusCode: HttpStatus.NOT_FOUND,
      message: exception.message,
    });
  }
}
