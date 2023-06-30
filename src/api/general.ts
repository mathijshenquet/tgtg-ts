export type ISO8601Date = string;

export interface Price {
  // Curency code
  code: string;

  // Amount of decimals in the minor_units (i.e. cents)
  decimals: number;

  // a price in minor units eg if decimals = 2 and minor_units = 1999 then
  // the price is 19.99
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
