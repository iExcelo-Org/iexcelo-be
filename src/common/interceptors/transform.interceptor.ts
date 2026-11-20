/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();

        // A controller may return its own { success, message, data } wrapper. Unwrap it whenever
        // the data key is there, even when it holds null. Otherwise "nothing found" would reach
        // the client as the wrapper object, which looks like real data.
        const isWrapper =
          data !== null &&
          typeof data === 'object' &&
          !Array.isArray(data) &&
          'data' in data;

        // If controller already returned success/message, preserve them
        // Otherwise, add success and statusCode
        return {
          success: data?.success ?? true,
          statusCode: response.statusCode,
          message: data?.message,
          data: isWrapper ? (data.data ?? null) : data,
        };
      }),
    );
  }
}
