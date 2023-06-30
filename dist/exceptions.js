"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TgtgPollingError = exports.TgtgAPIError = exports.TgtgLoginError = exports.HTTPStatus = void 0;
exports.HTTPStatus = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
};
class HTTPError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
class FetchError extends Error {
    constructor(response) {
        super(`${response.status}: ${response.statusText}`);
        this.response = response;
        this.statusCode = response.status;
    }
}
class TgtgLoginError extends FetchError {
}
exports.TgtgLoginError = TgtgLoginError;
class TgtgAPIError extends HTTPError {
}
exports.TgtgAPIError = TgtgAPIError;
class TgtgPollingError extends Error {
}
exports.TgtgPollingError = TgtgPollingError;
//# sourceMappingURL=exceptions.js.map