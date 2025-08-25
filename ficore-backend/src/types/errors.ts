// types/errors.ts
export class ValidationError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export class NotFoundError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

export class InsufficientCreditsError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientCreditsError';
    this.status = 402;
  }
}

export class UnauthorizedError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

export class DatabaseError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
    this.status = 500;
  }
}