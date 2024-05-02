import {
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';

type MyResponseObj = {
  statusCode: number;
  timeStamp: string;
  path: string;
  response?: string | object;
};

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const MyResponseObj: MyResponseObj = {
      statusCode: 500,
      timeStamp: new Date().toISOString(),
      path: request?.url ?? '',
      response: '',
    };
    if (exception instanceof Error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error(exception?.stack ?? '');
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const ex = exception as Record<string, unknown>;
      console.error(JSON.stringify(ex, null, 2));
    }

    if (exception instanceof HttpException) {
      MyResponseObj.statusCode = exception.getStatus();
      MyResponseObj.response = exception.getResponse();
    } else {
      MyResponseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      MyResponseObj.response = 'INTERNAL SERVER ERROR';
    }

    response.status(MyResponseObj.statusCode).json(MyResponseObj);

    super.catch(exception, host);
  }
}
