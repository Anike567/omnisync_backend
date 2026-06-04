import { Injectable } from "@nestjs/common";
import { ApiResponse } from "../interface/api-response";
import { NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()

export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
        const httpContext = context.switchToHttp();
        const response = httpContext.getResponse();
        const statusCode = response.statusCode;

        return next.handle().pipe(
            map((data) => ({
                status: statusCode,
                message: data?.message || 'Request successful',
                // If data contains a nested 'data' property, use it; otherwise, wrap the data object
                data: data?.data !== undefined ? data.data : data,
                error_message: null, // Success interceptor handles success states; errors are handled by Exception Filters
            }))
        )
    }

}