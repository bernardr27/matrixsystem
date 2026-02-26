
export class AppError extends Error {
    public code: string;
    public isOperational: boolean;

    constructor(message: string, code: string = 'INTERNAL_ERROR', isOperational: boolean = true) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
    }
}

export class AIException extends AppError {
    constructor(message: string) {
        super(message, 'AI_SERVICE_ERROR');
    }
}

export class AuthException extends AppError {
    constructor(message: string) {
        super(message, 'AUTH_ERROR');
    }
}
