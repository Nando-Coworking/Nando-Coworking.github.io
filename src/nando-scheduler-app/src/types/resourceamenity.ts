export interface ResourceAmenity {
    id: string;
    resource_id: string;
    amenity_id: string;
    name_override?: string;
    created_at: string;
    updated_at: string;
    amenities: Amenity;
}