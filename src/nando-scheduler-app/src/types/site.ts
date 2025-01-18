export interface Site {
    id: string;
    team_id: string;
    name: string;
    description?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    phone?: string;
    slug_name?: string;
    base64_image?: string;
    resources?: Array<{
        id: string;
        max_occupants: number;
    }>;
    resource_count?: number;
    total_capacity?: number;
}