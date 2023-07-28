import { PickupItem } from "./api";
export declare const BASE_URL: string;
export declare const ITEM_ENDPOINT: string;
export declare const AUTH_BY_EMAIL_ENDPOINT: string;
export declare const AUTH_POLLING_ENDPOINT: string;
export declare const AUTH_SIGNUP_BY_EMAIL_ENDPOINT: string;
export declare const AUTH_REFRESH_ENDPOINT: string;
export declare const ORDER_ACTIVE_ENDPOINT: string;
export declare const ORDER_INACTIVE_ENDPOINT: string;
export declare const ORDER_CREATE_ENDPOINT: string;
export declare const ORDER_ABORT_ENDPOINT: string;
export declare const ORDER_STATUS_ENDPOINT: string;
export declare const API_BUCKET_ENDPOINT: string;
export declare const DEFAULT_APK_VERSION: string;
export declare const DEFAULT_USER_AGENTS: string[];
export declare const DEFAULT_ACCESS_TOKEN_LIFETIME: number;
export declare const DEFAULT_DEVICE_TYPE: string;
export declare const POLLING_WAIT_TIME: number;
export declare const MAX_POLLING_TRIES: number;
export declare namespace TgtgClient {
    type GetItemsOptions = {
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
    interface Options {
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
    interface Init {
        email: string;
        session?: Session | null;
        didSessionChange?: (ses: Session) => void;
    }
    interface AuthToken {
        access_token: string;
        refresh_token: string;
        user_id: string;
    }
    type AuthInfo = AuthToken & {
        token_refresh_time: number;
    };
    type Session = AuthInfo & {
        cookie: string | null;
    };
    type Email = string;
}
export declare class TgtgClient {
    email: string;
    auth: TgtgClient.AuthInfo | null;
    cookie: string | null;
    didSessionChange: (ses: TgtgClient.Session) => void;
    base_url: string;
    access_token_lifetime: number;
    apk_version: string;
    user_agent: string;
    language: string;
    timeout?: number;
    device_type: string;
    constructor(init: TgtgClient.Init, options?: TgtgClient.Options);
    post(path: string, data: any): Promise<Response>;
    getCredentials(): Promise<TgtgClient.AuthToken>;
    getRefreshedAuth(): Promise<TgtgClient.AuthToken>;
    authByEmail(): Promise<void>;
    startPolling(pollingId: string): Promise<void>;
    getItems({ latitude, longitude, radius, page_size, page, discover, favorites_only, item_categories, diet_categories, pickup_earliest, pickup_latest, search_phrase, with_stock_only, hidden_only, we_care_only, }?: TgtgClient.GetItemsOptions): Promise<Array<PickupItem>>;
    getItem(item_id: string): Promise<any>;
    getFavorites(latitude?: number, longitude?: number, radius?: number, page_size?: number, page?: number): Promise<Array<PickupItem>>;
    setFavorite(item_id: string, is_favorite: boolean): Promise<void>;
    createOrder(item_id: number, item_count: number): Promise<any>;
    getOrderStatus(orderId: string): Promise<any>;
    abortOrder(orderId: string): Promise<any>;
    signUpByEmail(email: string, name?: string, countryId?: string, newsletterOptIn?: boolean, pushNotificationOptIn?: boolean): Promise<TgtgClient.AuthInfo>;
    getActive(): Promise<any>;
    getInactive(page?: number, pageSize?: number): Promise<any>;
}
