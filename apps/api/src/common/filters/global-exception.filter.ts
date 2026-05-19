import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { FastifyReply } from 'fastify';

interface ErrorResponse {
  data: null;
  error: string;
}

const HTTP_MESSAGES: Record<number, string> = {
  400: 'Permintaan tidak valid. Periksa kembali isian Anda.',
  401: 'Sesi Anda telah berakhir. Silakan login kembali.',
  403: 'Anda tidak memiliki akses untuk tindakan ini.',
  404: 'Data tidak ditemukan.',
  409: 'Data sudah ada. Periksa kembali isian Anda.',
  422: 'Data tidak valid. Periksa kembali isian Anda.',
  500: 'Terjadi kesalahan pada server. Silakan coba lagi.',
};

const PRISMA_MESSAGES: Record<string, string> = {
  P2002: 'Data sudah ada. Periksa kembali isian Anda.',
  P2003: 'Data terkait tidak ditemukan.',
  P2025: 'Data tidak ditemukan.',
  P2014: 'Data ini masih digunakan oleh data lain.',
};

const PRISMA_STATUS: Record<string, number> = {
  P2002: HttpStatus.CONFLICT,
  P2003: HttpStatus.BAD_REQUEST,
  P2025: HttpStatus.NOT_FOUND,
  P2014: HttpStatus.CONFLICT,
};

const FALLBACK_MESSAGE = 'Terjadi kesalahan. Silakan coba lagi.';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    const { statusCode, error } = this.resolveError(exception);
    reply
      .status(statusCode)
      .send({ data: null, error } satisfies ErrorResponse);
  }

  private resolveError(exception: unknown): {
    statusCode: number;
    error: string;
  } {
    if (exception instanceof HttpException)
      return this.handleHttpException(exception);
    if (exception instanceof Prisma.PrismaClientKnownRequestError)
      return this.handlePrismaError(exception);

    console.error('[GlobalExceptionFilter] Unknown error:', exception);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: FALLBACK_MESSAGE,
    };
  }

  private handleHttpException(exception: HttpException): {
    statusCode: number;
    error: string;
  } {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return { statusCode, error: response };
    }

    const body = response as Record<string, unknown>;

    if (Array.isArray(body.message)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: String(body.message[0]),
      };
    }

    return { statusCode, error: HTTP_MESSAGES[statusCode] ?? FALLBACK_MESSAGE };
  }

  private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    error: string;
  } {
    const error = PRISMA_MESSAGES[exception.code];

    if (!error) {
      console.error(
        '[GlobalExceptionFilter] Unhandled Prisma error:',
        exception,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: FALLBACK_MESSAGE,
      };
    }

    return {
      statusCode:
        PRISMA_STATUS[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR,
      error,
    };
  }
}
