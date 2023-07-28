

export const HTTPStatus = {
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
    constructor(public statusCode: number, message: string) {
      super(message);
    }
}

class FetchError extends Error {
    public statusCode?: number;
    
    constructor(response: Response | string) {
        if(typeof response == "string"){
            super(response);
        }else{
            super(`${response.status}: ${response.statusText}`);
            this.statusCode = response.status
        }
    }
}

export class TgtgLoginError extends FetchError {}

export class TgtgAPIError extends HTTPError {}

export class TgtgPollingError extends Error {}