export interface Resource {
    id: string;
    name: string;
    description: string;
    location_description: string;
    max_occupants: number;
    site_id: string;
    created_at: string;
    updated_at: string;
    amenity_count?: number;
}