export type ISO8601Date = string;
export interface Price {
    code: string;
    decimals: number;
    minor_units: number;
}
export interface Picture {
    picture_id: string;
    current_url: string;
    is_automatically_created: boolean;
}
export interface Interval {
    start: ISO8601Date;
    end: ISO8601Date;
}
