import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown = undefined;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409;
      const target = (error.meta?.target as string[])?.join(', ') ?? 'field';
      message = `A record with this ${target} already exists`;
    } else if (error.code === 'P2025') {
      statusCode = 404;
      message = (error.meta?.cause as string) || 'Requested record was not found';
    } else {
      statusCode = 400;
      message = `Database error (${error.code})`;
      details = error.meta;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  if (statusCode >= 500) {
    console.error('Unhandled server error:', error);
  }

  res.status(statusCode).json({
    error: {
      message,
      ...(details ? { details } : {})
    }
  });
};
