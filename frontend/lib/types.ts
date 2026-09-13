export type Filters = {
  location: string;
  property_type: string;
  budget: number;
  bedrooms: number;
};
export type Options = {
  dataset_version: string;
  locations: string[];
  property_types: string[];
  currency: string;
  area_unit: string;
};
export type Listing = {
  id: string;
  building_name: string | null;
  location: string;
  property_type: string;
  price: number;
  size_sqft: number | null;
  bedrooms: number;
  bathrooms: number | null;
  price_per_sqft: number | null;
  price_delta: number;
  price_delta_pct: number;
  bedroom_delta: number;
};
export type Matches = {
  total: number;
  limit: number;
  applied_filters: Filters;
  results: Listing[];
};
export type Extraction = {
  filters: { [K in keyof Filters]: Filters[K] | null };
  review_notes: string[];
};
export type Analytics = {
  total_listings: number;
  median_asking_price: number | null;
  valid_price_count: number;
  missing_location_count: number;
  scope: "all_listings";
  price_distribution: {
    bin_start: number;
    bin_end: number;
    count: number;
    is_overflow: boolean;
  }[];
  by_location: {
    location: string;
    count: number;
    median_asking_price: number | null;
  }[];
};

export type SearchForm = { [Key in keyof Filters]: string };

export type Assessment = {
  listing_id: string;
  status: "available" | "unavailable";
  asking_price: number | null;
  estimated_price: number | null;
  price_difference: number | null;
  price_difference_pct: number | null;
  unavailable_reason: string | null;
  inputs: {
    size_sqft: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    facility_count: number | null;
    property_type: string | null;
    tenure: string | null;
    land_title: string | null;
    location: string | null;
  };
  comparable_count: number;
  comparables: {
    id: string;
    building_name: string | null;
    location: string | null;
    property_type: string | null;
    price: number | null;
    size_sqft: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    price_per_sqft: number | null;
  }[];
  comparable_rules: string;
  model_name: "Random Forest";
};
