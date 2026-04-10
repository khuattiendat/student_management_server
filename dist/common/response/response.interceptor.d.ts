import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class ResponseInterceptor implements NestInterceptor {
    intercept<T>(context: ExecutionContext, next: CallHandler): Observable<{
        status: string;
        data: T;
    }>;
}
