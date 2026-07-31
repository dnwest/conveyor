import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import {
  DeadLetterAlreadyReplayedError,
  DeadLetterNotFoundError,
  DeadLetterNotReplayableError,
  OrderNotFoundError,
} from '../core/errors';

type DomainError =
  | OrderNotFoundError
  | DeadLetterNotFoundError
  | DeadLetterAlreadyReplayedError
  | DeadLetterNotReplayableError;

// The HTTP meaning of a domain failure belongs at the edge, not in the core.
const STATUS_BY_ERROR = new Map<string, HttpStatus>([
  [OrderNotFoundError.name, HttpStatus.NOT_FOUND],
  [DeadLetterNotFoundError.name, HttpStatus.NOT_FOUND],
  [DeadLetterAlreadyReplayedError.name, HttpStatus.CONFLICT],
  [DeadLetterNotReplayableError.name, HttpStatus.UNPROCESSABLE_ENTITY],
]);

@Catch(
  OrderNotFoundError,
  DeadLetterNotFoundError,
  DeadLetterAlreadyReplayedError,
  DeadLetterNotReplayableError,
)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const status = STATUS_BY_ERROR.get(exception.name) ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const response = host.switchToHttp().getResponse<Response>();

    response.status(status).json({ statusCode: status, message: exception.message });
  }
}
