export declare const HTTPStatus: {
    OK: number;
    CREATED: number;
    ACCEPTED: number;
    BAD_REQUEST: number;
    UNAUTHORIZED: number;
    FORBIDDEN: number;
    NOT_FOUND: number;
    TOO_MANY_REQUESTS: number;
    INTERNAL_SERVER_ERROR: number;
};
declare class HTTPError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string);
}
declare class FetchError extends Error {
    statusCode?: number;
    constructor(response: Response | string);
}
export declare class TgtgLoginError extends FetchError {
}
export declare class TgtgAPIError extends HTTPError {
}
export declare class TgtgPollingError extends Error {
}
export {};
