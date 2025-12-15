import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validate = (schema: z.ZodTypeAny) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors: Array<{ field: string; message: string }> = error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return next(new ApiError(400, 'Validation failed', errors));
            }
            return next(new ApiError(400, 'Validation failed'));
        }
    };
};
