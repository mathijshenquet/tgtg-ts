"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TgtgClient = exports.MAX_POLLING_TRIES = exports.POLLING_WAIT_TIME = exports.DEFAULT_DEVICE_TYPE = exports.DEFAULT_ACCESS_TOKEN_LIFETIME = exports.DEFAULT_USER_AGENTS = exports.DEFAULT_APK_VERSION = exports.API_BUCKET_ENDPOINT = exports.ORDER_STATUS_ENDPOINT = exports.ORDER_ABORT_ENDPOINT = exports.ORDER_CREATE_ENDPOINT = exports.ORDER_INACTIVE_ENDPOINT = exports.ORDER_ACTIVE_ENDPOINT = exports.AUTH_REFRESH_ENDPOINT = exports.AUTH_SIGNUP_BY_EMAIL_ENDPOINT = exports.AUTH_POLLING_ENDPOINT = exports.AUTH_BY_EMAIL_ENDPOINT = exports.ITEM_ENDPOINT = exports.BASE_URL = void 0;
const exceptions_1 = require("./exceptions");
exports.BASE_URL = "https://apptoogoodtogo.com/api";
// endpoints
exports.ITEM_ENDPOINT = "item/v8";
exports.AUTH_BY_EMAIL_ENDPOINT = "auth/v3/authByEmail";
exports.AUTH_POLLING_ENDPOINT = "auth/v3/authByRequestPollingId";
exports.AUTH_SIGNUP_BY_EMAIL_ENDPOINT = "auth/v3/signUpByEmail";
exports.AUTH_REFRESH_ENDPOINT = "auth/v3/token/refresh";
exports.ORDER_ACTIVE_ENDPOINT = "order/v6/active";
exports.ORDER_INACTIVE_ENDPOINT = "order/v6/inactive";
exports.ORDER_CREATE_ENDPOINT = "order/v7/create";
exports.ORDER_ABORT_ENDPOINT = "order/v7/{}/abort";
exports.ORDER_STATUS_ENDPOINT = "order/v7/{}/status";
exports.API_BUCKET_ENDPOINT = "discover/v1/bucket";
// default config
exports.DEFAULT_APK_VERSION = "23.6.11";
exports.DEFAULT_USER_AGENTS = [
    "TGTG/{} Dalvik/2.1.0 (Linux; U; Android 9; Nexus 5 Build/M4B30Z)",
    "TGTG/{} Dalvik/2.1.0 (Linux; U; Android 10; SM-G935F Build/NRD90M)",
    "TGTG/{} Dalvik/2.1.0 (Linux; Android 12; SM-G920V Build/MMB29K)",
];
exports.DEFAULT_ACCESS_TOKEN_LIFETIME = 3600 * 4; // 4 hours
exports.DEFAULT_DEVICE_TYPE = "ANDROID";
exports.POLLING_WAIT_TIME = 2 * 1000; // seconds
exports.MAX_POLLING_TRIES = 150; // 150 * POLLING_WAIT_TIME = 5 minutes
function randomArray(array) {
    const index = Math.floor(Math.random() * array.length);
    return array[index];
}
class TgtgClient {
    constructor(init, options = {}) {
        var _a, _b, _c, _d, _e, _f;
        this.auth = null;
        this.cookie = null;
        this.apk_version = exports.DEFAULT_APK_VERSION; // TODO
        this.email = init.email;
        if (init.session) {
            let { access_token, refresh_token, user_id, cookie, token_refresh_time } = init.session;
            this.auth = { access_token, refresh_token, user_id, token_refresh_time };
            this.cookie = cookie;
        }
        this.didSessionChange = (_a = init.didSessionChange) !== null && _a !== void 0 ? _a : (() => { return; });
        // static config
        this.base_url = (_b = options.base_url) !== null && _b !== void 0 ? _b : exports.BASE_URL;
        this.user_agent =
            (_c = options.user_agent) !== null && _c !== void 0 ? _c : randomArray(exports.DEFAULT_USER_AGENTS);
        this.language = (_d = options.language) !== null && _d !== void 0 ? _d : "en-UK";
        this.timeout = options.timeout;
        this.access_token_lifetime =
            (_e = options.access_token_lifetime) !== null && _e !== void 0 ? _e : exports.DEFAULT_ACCESS_TOKEN_LIFETIME;
        this.device_type = (_f = options.device_type) !== null && _f !== void 0 ? _f : exports.DEFAULT_DEVICE_TYPE;
    }
    post(path, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = {
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
            let init = {
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
            let response = yield fetch(url, init);
            let cookie = response.headers.get("Set-Cookie");
            if (cookie)
                this.cookie = cookie;
            return response;
        });
    }
    getCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getRefreshedAuth();
        });
    }
    getRefreshedAuth() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.auth == null) {
                throw new Error("There is no active session, call authByEmail first!");
            }
            let accessTokenAge = Date.now() - this.auth.token_refresh_time;
            if (accessTokenAge >= this.access_token_lifetime * 1000) {
                const response = yield this.post(exports.AUTH_REFRESH_ENDPOINT, {
                    refresh_token: this.auth.refresh_token,
                });
                if (response.status == exceptions_1.HTTPStatus.OK) {
                    const data = yield response.json();
                    this.auth.access_token = data.access_token;
                    this.auth.refresh_token = data.refresh_token;
                    this.auth.token_refresh_time = Date.now();
                    this.didSessionChange(Object.assign(Object.assign({}, this.auth), { cookie: this.cookie }));
                }
                else {
                    throw new exceptions_1.TgtgAPIError(response.status, yield response.text());
                }
            }
            return this.auth;
        });
    }
    authByEmail() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.auth) {
                throw Error("There is already a session active");
            }
            const response = yield this.post(exports.AUTH_BY_EMAIL_ENDPOINT, {
                device_type: this.device_type,
                email: this.email,
            });
            if (response.status == exceptions_1.HTTPStatus.OK) {
                const first_login_response = yield response.json();
                if (first_login_response.state == "TERMS") {
                    throw new exceptions_1.TgtgLoginError(`This email ${this.email} is not linked to a tgtg account. Please signup with this email first.`);
                }
                else if (first_login_response["state"] == "WAIT") {
                    yield this.startPolling(first_login_response["polling_id"]);
                }
                else {
                    throw new exceptions_1.TgtgLoginError(response);
                }
            }
            else {
                if (response.status == exceptions_1.HTTPStatus.TOO_MANY_REQUESTS) {
                    throw new exceptions_1.TgtgAPIError(response.status, "Too many requests. Try again later.");
                }
                else {
                    throw new exceptions_1.TgtgLoginError(response);
                }
            }
        });
    }
    startPolling(pollingId) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < exports.MAX_POLLING_TRIES; i++) {
                const response = yield this.post(exports.AUTH_POLLING_ENDPOINT, {
                    device_type: this.device_type,
                    email: this.email,
                    request_polling_id: pollingId,
                });
                if (response.status === exceptions_1.HTTPStatus.ACCEPTED) {
                    console.log("Check your mailbox on PC to continue... ");
                    console.log("(Mailbox on mobile won't work, if you have installed tgtg app.)");
                    yield new Promise((resolve) => setTimeout(resolve, exports.POLLING_WAIT_TIME));
                }
                else if (response.status === exceptions_1.HTTPStatus.OK) {
                    console.log("Logged in!");
                    const loginResponse = yield response.json();
                    console.log("loginReponse", loginResponse);
                    this.auth = {
                        access_token: loginResponse.access_token,
                        refresh_token: loginResponse.refresh_token,
                        user_id: loginResponse.startup_data.user.user_id,
                        token_refresh_time: Date.now()
                    };
                    this.didSessionChange(Object.assign(Object.assign({}, this.auth), { cookie: this.cookie }));
                    return;
                }
                else {
                    if (response.status === exceptions_1.HTTPStatus.TOO_MANY_REQUESTS) {
                        throw new exceptions_1.TgtgAPIError(response.status, "Too many requests. Try again later.");
                    }
                    else {
                        throw new exceptions_1.TgtgLoginError(response);
                    }
                }
                yield new Promise((resolve) => setTimeout(resolve, exports.POLLING_WAIT_TIME));
            }
            throw new exceptions_1.TgtgPollingError(`Max retries (${exports.MAX_POLLING_TRIES * exports.POLLING_WAIT_TIME} seconds) reached. Try again.`);
        });
    }
    getItems({ latitude = 0.0, longitude = 0.0, radius = 21, page_size = 20, page = 1, discover = false, favorites_only = true, item_categories = [], diet_categories = [], pickup_earliest = null, pickup_latest = null, search_phrase = null, with_stock_only = false, hidden_only = false, we_care_only = false, } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // if(!(1 <= page_size && page_size <= 400)){
            //     throw new TgtgAPIError("page_size must be between 1 and 400 inclusive");
            // }
            let { user_id } = yield this.getRefreshedAuth();
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
            const response = yield this.post(exports.ITEM_ENDPOINT, query);
            let data = yield response.json();
            // console.log(util.inspect(data, false, null, true /* enable colors */))
            if (response.status === exceptions_1.HTTPStatus.OK) {
                return data.items;
            }
            else {
                throw new exceptions_1.TgtgAPIError(response.status, yield response.text());
            }
        });
    }
    getItem(item_id) {
        return __awaiter(this, void 0, void 0, function* () {
            let { user_id } = yield this.getRefreshedAuth();
            const response = yield this.post(`${exports.ITEM_ENDPOINT}/${item_id}`, {
                user_id,
                origin: null,
            });
            if (response.status === 200) {
                return response.json();
            }
            else {
                throw new exceptions_1.TgtgAPIError(response.status, response.statusText);
            }
        });
    }
    getFavorites(latitude = 0.0, longitude = 0.0, radius = 21, page_size = 50, page = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            // if(!(1 <= page_size && page_size <= 400)){
            //     throw new TgtgAPIError("page_size must be between 1 and 400 inclusive");
            // }
            let { user_id } = yield this.getRefreshedAuth();
            const response = yield this.post(exports.API_BUCKET_ENDPOINT, {
                origin: { latitude: latitude, longitude: longitude },
                radius: radius,
                user_id,
                paging: { page: page, size: page_size },
                bucket: { filler_type: "Favorites" },
            });
            let data = yield response.json();
            if (response.status === 200) {
                return data.mobile_bucket.items;
            }
            else {
                throw new exceptions_1.TgtgAPIError(response.status, response.statusText);
            }
        });
    }
    setFavorite(item_id, is_favorite) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getRefreshedAuth();
            const response = yield this.post(`${exports.ITEM_ENDPOINT}/${item_id}/setFavorite`, { is_favorite });
            if (response.status !== exceptions_1.HTTPStatus.OK) {
                throw new exceptions_1.TgtgAPIError(response.status, yield response.text());
            }
        });
    }
    createOrder(item_id, item_count) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getRefreshedAuth();
            const response = yield this.post(`${exports.ORDER_CREATE_ENDPOINT}/${item_id}`, { item_count });
            let content = yield response.text();
            if (response.status !== exceptions_1.HTTPStatus.OK) {
                throw new exceptions_1.TgtgAPIError(response.status, content);
            }
            let data = yield response.json();
            if (data.state !== "SUCCESS") {
                throw new exceptions_1.TgtgAPIError(data.state, content);
            }
            else {
                return data.order;
            }
        });
    }
    getOrderStatus(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getRefreshedAuth();
            const response = yield this.post(exports.ORDER_STATUS_ENDPOINT.replace("{}", orderId), {});
            if (response.status === exceptions_1.HTTPStatus.OK) {
                return response.json();
            }
            else {
                throw new exceptions_1.TgtgAPIError(response.status, yield response.text());
            }
        });
    }
    abortOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            /* Use this when your order is not yet paid */
            yield this.getRefreshedAuth();
            const response = yield this.post(exports.ORDER_ABORT_ENDPOINT.replace("{}", orderId), { cancel_reason_id: 1 });
            let data = yield response.json();
            if (response.status !== exceptions_1.HTTPStatus.OK) {
                throw new exceptions_1.TgtgAPIError(response.status, yield response.text());
            }
            else if (data.state !== "SUCCESS") {
                throw new exceptions_1.TgtgAPIError(data.state, yield response.text());
            }
            else {
                return response;
            }
        });
    }
    signUpByEmail(email, name = "", countryId = "GB", newsletterOptIn = false, pushNotificationOptIn = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.post(exports.AUTH_SIGNUP_BY_EMAIL_ENDPOINT, {
                countryId,
                deviceType: this.device_type,
                email,
                name,
                newsletterOptIn,
                pushNotificationOptIn,
            });
            let data = yield response.json();
            if (response.status === exceptions_1.HTTPStatus.OK) {
                this.auth = {
                    access_token: data.login_response.access_token,
                    refresh_token: data.login_response.refresh_token,
                    token_refresh_time: Date.now(),
                    user_id: data.login_response.startup_data.user.user_id
                };
                this.didSessionChange(Object.assign(Object.assign({}, this.auth), { cookie: this.cookie }));
                return this.auth;
            }
            else {
                throw new exceptions_1.TgtgAPIError(response.status, data);
            }
        });
    }
    getActive() {
        return __awaiter(this, void 0, void 0, function* () {
            let { user_id } = yield this.getRefreshedAuth();
            const response = yield this.post(exports.ORDER_ACTIVE_ENDPOINT, {
                user_id,
            });
            let data = yield response.json();
            if (response.status === exceptions_1.HTTPStatus.OK) {
                return data;
            }
            else {
                throw new exceptions_1.TgtgAPIError(response.status, data);
            }
        });
    }
    getInactive(page = 0, pageSize = 20) {
        return __awaiter(this, void 0, void 0, function* () {
            let { user_id } = yield this.getRefreshedAuth();
            const response = yield this.post(exports.ORDER_INACTIVE_ENDPOINT, {
                paging: { page, size: pageSize },
                user_id,
            });
            let data = yield response.json();
            if (response.status === exceptions_1.HTTPStatus.OK) {
                return data;
            }
            else {
                throw new exceptions_1.TgtgAPIError(response.status, yield response.text());
            }
        });
    }
}
exports.TgtgClient = TgtgClient;
//# sourceMappingURL=client.js.map