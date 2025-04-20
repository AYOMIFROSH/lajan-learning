class creatError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fall' : 'error';

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = creatError;

