import { Interval, ISO8601Date, Picture, Price } from "./general";
export interface SalesTax {
    tax_description: string;
    tax_percentage: number;
}
export interface Badge {
    badge_type: string;
    rating_group: string;
    percentage: number;
    user_count: number;
    month_count: number;
}
export interface Rating {
    average_overall_rating: number;
    rating_count: number;
    month_count: number;
}
export interface Item {
    item_id: string;
    sales_taxes: SalesTax[];
    tax_amount: Price;
    price_excluding_taxes: Price;
    price_including_taxes: Price;
    value_excluding_taxes: Price;
    value_including_taxes: Price;
    taxation_policy: string;
    show_sales_taxes: boolean;
    cover_picture: Picture;
    logo_picture: Picture;
    name: string;
    description: string;
    can_user_supply_packaging: boolean;
    packaging_option: string;
    collection_info: string;
    diet_categories: string[];
    item_category: string;
    buffet: boolean;
    badges: Badge[];
    positive_rating_reasons: string[];
    average_overall_rating: Rating;
    favorite_count: number;
}
export interface Country {
    iso_code: string;
    name: string;
}
export interface Address {
    country: Country;
    address_line: string;
    city: string;
    postal_code: string;
}
export interface Coordinates {
    longitude: number;
    latitude: number;
}
export interface Location {
    address: Address;
    location: Coordinates;
}
export interface Store {
    store_id: string;
    store_name: string;
    branch: string;
    description: string;
    website: string;
    store_location: Location;
    logo_picture: Picture;
    store_time_zone: string;
    hidden: boolean;
    favorite_count: number;
    we_care: boolean;
    distance: number;
    cover_picture: Picture;
    is_manufacturer: boolean;
}
export interface PickupItem {
    item: Item;
    store: Store;
    display_name: string;
    pickup_interval: Interval;
    pickup_location: {
        address: Address;
        location: Location;
    };
    purchase_end: ISO8601Date;
    items_available: number;
    sold_out_at: ISO8601Date;
    distance: number;
    favorite: boolean;
    in_sales_window: boolean;
    new_item: boolean;
    item_type: string;
}
