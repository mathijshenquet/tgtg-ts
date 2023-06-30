import { PickupItem } from "./api";
import {
    HTTPStatus,
    TgtgAPIError,
    TgtgLoginError,
    TgtgPollingError,
} from "./exceptions";

export const BASE_URL: string = "https://apptoogoodtogo.com/api";

// endpoints
export const ITEM_ENDPOINT: string = "item/v8";

export const AUTH_BY_EMAIL_ENDPOINT: string = "auth/v3/authByEmail";
export const AUTH_POLLING_ENDPOINT: string = "auth/v3/authByRequestPollingId";
export const AUTH_SIGNUP_BY_EMAIL_ENDPOINT: string = "auth/v3/signUpByEmail";
export const AUTH_REFRESH_ENDPOINT: string = "auth/v3/token/refresh";

export const ORDER_ACTIVE_ENDPOINT: string = "order/v6/active";
export const ORDER_INACTIVE_ENDPOINT: string = "order/v6/inactive";
export const ORDER_CREATE_ENDPOINT: string = "order/v7/create";
export const ORDER_ABORT_ENDPOINT: string = "order/v7/{}/abort";
export const ORDER_STATUS_ENDPOINT: string = "order/v7/{}/status";

export const API_BUCKET_ENDPOINT: string = "discover/v1/bucket";

// default config
export const DEFAULT_APK_VERSION: string = "23.6.11";

export const DEFAULT_USER_AGENTS: string[] = [
    "TGTG/{} Dalvik/2.1.0 (Linux; U; Android 9; Nexus 5 Build/M4B30Z)",
    "TGTG/{} Dalvik/2.1.0 (Linux; U; Android 10; SM-G935F Build/NRD90M)",
    "TGTG/{} Dalvik/2.1.0 (Linux; Android 12; SM-G920V Build/MMB29K)",
];

export const DEFAULT_ACCESS_TOKEN_LIFETIME: number = 3600 * 4; // 4 hours
export const DEFAULT_DEVICE_TYPE: string = "ANDROID";

export const POLLING_WAIT_TIME: number = 5 * 1000; // seconds
export const MAX_POLLING_TRIES: number = 24; // 24 * POLLING_WAIT_TIME = 2 minutes

function randomArray<T>(array: Array<T>): T {
    const index = Math.floor(Math.random() * array.length);
    return array[index];
}

export namespace TgtgClient {
    export type GetItemsOptions = {
        latitude?: number;
        longitude?: number;
        radius?: number;
        page_size?: number;
        page?: number;
        discover?: boolean;
        favorites_only?: boolean;
        item_categories?: any[];
        diet_categories?: any[];
        pickup_earliest?: any;
        pickup_latest?: any;
        search_phrase?: string | null;
        with_stock_only?: boolean;
        hidden_only?: boolean;
        we_care_only?: boolean;
    };

    export interface Options {
        base_url?: string;
        user_agent?: string;
        language?: string;
        timeout?: number;
        device_type?: string;
        access_token_lifetime?: number;
    }

    /**
     * Initialize with an email and optional session object. 
     * 
     * Tgtg is passwordless so users are authenticated with an email upon which
     * the client receives credentials in the form of a session token. Whenever
     * this happens the `didSessionChange` callback is called with the updated 
     * session. If the session is provided the previous session is continued. 
     * 
     * Session management is outside of the scope of this library.
     */
    export interface Init {
        email: string,
        session?: Session | null,
        didSessionChange?: (ses: Session) => void,
    }

    export interface AuthToken {
        access_token: string;
        refresh_token: string;
        user_id: string;
    }

    export type AuthInfo = AuthToken & { token_refresh_time: number }

    export type Session = AuthInfo & { cookie: string | null };

    export type Email = string;
}


export class TgtgClient {
    email: string;
    auth: TgtgClient.AuthInfo | null = null;
    cookie: string | null = null;
    didSessionChange: (ses: TgtgClient.Session) => void;

    // static config
    base_url: string;
    
    access_token_lifetime: number;
    apk_version: string = DEFAULT_APK_VERSION; // TODO
    user_agent: string;
    language: string;
    timeout?: number;

    device_type: string;

    constructor(init: TgtgClient.Init, options: TgtgClient.Options = {}) {
        this.email = init.email;

        if(init.session){
            let {access_token, refresh_token, user_id, cookie, token_refresh_time} = init.session;
            this.auth = {access_token, refresh_token, user_id, token_refresh_time};
            this.cookie = cookie;
        }

        this.didSessionChange = init.didSessionChange ?? (() => { return; });

        // static config
        this.base_url = options.base_url ?? BASE_URL;
        this.user_agent =
            options.user_agent ?? randomArray(DEFAULT_USER_AGENTS);
        this.language = options.language ?? "en-UK";
        this.timeout = options.timeout;
        this.access_token_lifetime =
            options.access_token_lifetime ?? DEFAULT_ACCESS_TOKEN_LIFETIME;
        this.device_type = options.device_type ?? DEFAULT_DEVICE_TYPE;
    }

    async post(path: string, data: any): Promise<Response> {
        const headers: HeadersInit = {
            accept: "application/json",
            "Accept-Encoding": "gzip",
            "accept-language": this.language,
            "content-type": "application/json; charset=utf-8",
            "user-agent": this.user_agent.replace("{}", this.apk_version),
        };

        if (this.cookie) {
            headers.Cookie = this.cookie;
        }

        if (this.auth) {
            headers.authorization = `Bearer ${this.auth.access_token}`;
        }

        let init: RequestInit = {
            body: JSON.stringify(data),
            method: "POST",
            headers,
        };

        if (this.timeout) {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), this.timeout);
            init.signal = controller.signal;
        }

        let url = `${this.base_url}/${path}`;

        console.log("POST", url, data);
        let response = await fetch(url, init);

        let cookie = response.headers.get("Set-Cookie");
        if(cookie)
            this.cookie = cookie;

        return response;
    }

    public async getCredentials(): Promise<TgtgClient.AuthToken> {
        return this.getRefreshedAuth();
    }
   
    async getRefreshedAuth(): Promise<TgtgClient.AuthToken> {
        if(this.auth == null){
            throw new Error("There is no active session, call authByEmail first!")
        }

        let accessTokenAge = Date.now() - this.auth.token_refresh_time;

        if(accessTokenAge >= this.access_token_lifetime * 1000){
            const response = await this.post(AUTH_REFRESH_ENDPOINT, {
                refresh_token: this.auth.refresh_token,
            });

            if (response.status == HTTPStatus.OK) {
                const data = await response.json();
                this.auth.access_token = data.access_token;
                this.auth.refresh_token = data.refresh_token;
                this.auth.token_refresh_time = Date.now();
                this.didSessionChange({
                    ...this.auth,
                    cookie: this.cookie
                })
            } else {
                throw new TgtgAPIError(response.status, await response.text());
            }
        }

        

        return this.auth;
    }

    public async authByEmail(): Promise<void> {
        if(this.auth) {
            throw Error("There is already a session active");
        }

        const response = await this.post(AUTH_BY_EMAIL_ENDPOINT, {
            device_type: this.device_type,
            email: this.email,
        });
        if (response.status == HTTPStatus.OK) {
            const first_login_response: any = await response.json();
            if (first_login_response.state == "TERMS") {
                throw new TgtgPollingError(
                    `This email ${this.email} is not linked to a tgtg account. Please signup with this email first.`
                );
            } else if (first_login_response["state"] == "WAIT") {
                await this.startPolling(first_login_response["polling_id"]);
            } else {
                throw new TgtgLoginError(response);
            }
        } else {
            if (response.status == HTTPStatus.TOO_MANY_REQUESTS) {
                throw new TgtgAPIError(
                    response.status,
                    "Too many requests. Try again later."
                );
            } else {
                throw new TgtgLoginError(response);
            }
        }
    }

    async startPolling(pollingId: string): Promise<void> {
        for (let i = 0; i < MAX_POLLING_TRIES; i++) {
            const response = await this.post(AUTH_POLLING_ENDPOINT, {
                device_type: this.device_type,
                email: this.email,
                request_polling_id: pollingId,
            });
            if (response.status === HTTPStatus.ACCEPTED) {
                console.log("Check your mailbox on PC to continue... ");
                console.log(
                    "(Mailbox on mobile won't work, if you have installed tgtg app.)"
                );
                await new Promise((resolve) =>
                    setTimeout(resolve, POLLING_WAIT_TIME)
                );
            } else if (response.status === HTTPStatus.OK) {
                console.log("Logged in!");
                const loginResponse = await response.json();

                console.log("loginReponse", loginResponse);

                this.auth = {
                    access_token: loginResponse.access_token,
                    refresh_token: loginResponse.refresh_token,
                    user_id: loginResponse.startup_data.user.user_id,
                    token_refresh_time: Date.now()
                }

                this.didSessionChange({
                    ...this.auth,
                    cookie: this.cookie
                })

                return;
            } else {
                if (response.status === HTTPStatus.TOO_MANY_REQUESTS) {
                    throw new TgtgAPIError(
                        response.status,
                        "Too many requests. Try again later."
                    );
                } else {
                    throw new TgtgLoginError(response);
                }
            }
            await new Promise((resolve) =>
                setTimeout(resolve, POLLING_WAIT_TIME)
            );
        }
        throw new TgtgPollingError(
            `Max retries (${
                MAX_POLLING_TRIES * POLLING_WAIT_TIME
            } seconds) reached. Try again.`
        );
    }

    public async getItems({
        latitude = 0.0,
        longitude = 0.0,
        radius = 21,
        page_size = 20,
        page = 1,
        discover = false,
        favorites_only = true,
        item_categories = [],
        diet_categories = [],
        pickup_earliest = null,
        pickup_latest = null,
        search_phrase = null,
        with_stock_only = false,
        hidden_only = false,
        we_care_only = false,
    }: TgtgClient.GetItemsOptions = {}): Promise<Array<PickupItem>> {
        // if(!(1 <= page_size && page_size <= 400)){
        //     throw new TgtgAPIError("page_size must be between 1 and 400 inclusive");
        // }

        let {user_id} = await this.getRefreshedAuth();

        const query = {
            user_id,
            origin: { latitude, longitude },
            radius,
            page_size,
            page,
            discover,
            favorites_only,
            item_categories: item_categories || [],
            diet_categories: diet_categories || [],
            pickup_earliest,
            pickup_latest,
            search_phrase,
            with_stock_only,
            hidden_only,
            we_care_only,
        };

        const response = await this.post(ITEM_ENDPOINT, query);
        let data = await response.json();

        // console.log(util.inspect(data, false, null, true /* enable colors */))

        if (response.status === HTTPStatus.OK) {
            return data.items;
        } else {
            throw new TgtgAPIError(response.status, await response.text());
        }
    }

    public async getItem(item_id: string): Promise<any> {
        let {user_id} = await this.getRefreshedAuth();
        const response = await this.post(`${ITEM_ENDPOINT}/${item_id}`, {
            user_id,
            origin: null,
        });
        if (response.status === 200) {
            return response.json();
        } else {
            throw new TgtgAPIError(response.status, response.statusText);
        }
    }

    public async getFavorites(
        latitude: number = 0.0,
        longitude: number = 0.0,
        radius: number = 21,
        page_size: number = 50,
        page: number = 1
    ): Promise<Array<PickupItem>> {
        // if(!(1 <= page_size && page_size <= 400)){
        //     throw new TgtgAPIError("page_size must be between 1 and 400 inclusive");
        // }

        let {user_id} = await this.getRefreshedAuth();
        const response = await this.post(API_BUCKET_ENDPOINT, {
            origin: { latitude: latitude, longitude: longitude },
            radius: radius,
            user_id,
            paging: { page: page, size: page_size },
            bucket: { filler_type: "Favorites" },
        });
        let data = await response.json();
        if (response.status === 200) {
            return data.mobile_bucket.items;
        } else {
            throw new TgtgAPIError(response.status, response.statusText);
        }
    }

    public async setFavorite(
        item_id: string,
        is_favorite: boolean
    ): Promise<void> {
        await this.getRefreshedAuth();
        const response = await this.post(
            `${ITEM_ENDPOINT}/${item_id}/setFavorite`,
            { is_favorite }
        );
        if (response.status !== HTTPStatus.OK) {
            throw new TgtgAPIError(response.status, await response.text());
        }
    }

    public async createOrder(
        item_id: number,
        item_count: number
    ): Promise<any> {
        await this.getRefreshedAuth();
        const response = await this.post(
            `${ORDER_CREATE_ENDPOINT}/${item_id}`,
            { item_count }
        );
        let content = await response.text();

        if (response.status !== HTTPStatus.OK) {
            throw new TgtgAPIError(response.status, content);
        }

        let data = await response.json();
        if (data.state !== "SUCCESS") {
            throw new TgtgAPIError(data.state, content);
        } else {
            return data.order;
        }
    }

    public async getOrderStatus(orderId: string): Promise<any> {
        await this.getRefreshedAuth();
        const response = await this.post(
            ORDER_STATUS_ENDPOINT.replace("{}", orderId),
            {}
        );
        if (response.status === HTTPStatus.OK) {
            return response.json();
        } else {
            throw new TgtgAPIError(response.status, await response.text());
        }
    }

    public async abortOrder(orderId: string): Promise<any> {
        /* Use this when your order is not yet paid */
        await this.getRefreshedAuth();
        const response = await this.post(
            ORDER_ABORT_ENDPOINT.replace("{}", orderId),
            { cancel_reason_id: 1 }
        );
        let data = await response.json();

        if (response.status !== HTTPStatus.OK) {
            throw new TgtgAPIError(response.status, await response.text());
        } else if (data.state !== "SUCCESS") {
            throw new TgtgAPIError(data.state, await response.text());
        } else {
            return response;
        }
    }
    public async signUpByEmail(
        email: string,
        name: string = "",
        countryId: string = "GB",
        newsletterOptIn: boolean = false,
        pushNotificationOptIn: boolean = true
    ): Promise<TgtgClient.AuthInfo> {
        const response = await this.post(AUTH_SIGNUP_BY_EMAIL_ENDPOINT, {
            countryId,
            deviceType: this.device_type,
            email,
            name,
            newsletterOptIn,
            pushNotificationOptIn,
        });

        let data = await response.json();

        if (response.status === HTTPStatus.OK) {
            this.auth = {
                access_token: data.login_response.access_token,
                refresh_token: data.login_response.refresh_token,
                token_refresh_time: Date.now(),
                user_id: data.login_response.startup_data.user.user_id
            }
            this.didSessionChange({
                ...this.auth,
                cookie: this.cookie
            })

            return this.auth;
        } else {
            throw new TgtgAPIError(response.status, data);
        }
    }

    public async getActive(): Promise<any> {
        let {user_id} = await this.getRefreshedAuth();

        const response = await this.post(ORDER_ACTIVE_ENDPOINT, {
            user_id,
        });
        let data = await response.json();
        if (response.status === HTTPStatus.OK) {
            return data;
        } else {
            throw new TgtgAPIError(response.status, data);
        }
    }

    public async getInactive(
        page: number = 0,
        pageSize: number = 20
    ): Promise<any> {
        let {user_id} = await this.getRefreshedAuth();

        const response = await this.post(ORDER_INACTIVE_ENDPOINT, {
            paging: { page, size: pageSize },
            user_id,
        });

        let data = await response.json();

        if (response.status === HTTPStatus.OK) {
            return data;
        } else {
            throw new TgtgAPIError(response.status, await response.text());
        }
    }
}
