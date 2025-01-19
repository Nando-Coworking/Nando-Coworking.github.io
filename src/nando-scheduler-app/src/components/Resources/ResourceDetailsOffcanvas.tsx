import React, { useState, useEffect } from 'react';
import { Offcanvas, ListGroup, Button, Badge } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import { Resource } from '../../types/resource';
import { ResourceAmenity } from '../../types/ResourceAmenity';
import { ResourceEditForm } from './ResourceEditForm';
import { ResourceAmenityAddForm } from './ResourceAmenityAddForm';
import { ResourceAmenityDeleteConfirmation } from './ResourceAmenityDeleteConfirmation';

interface Props {
    show: boolean;
    onHide: () => void;
    resource: Resource | null;
    userRole?: string;
    onResourceUpdated: () => void;
    onResourceDeleted: () => void;
}

export const ResourceDetailsOffcanvas: React.FC<Props> = ({
    show,
    onHide,
    resource,
    userRole,
    onResourceUpdated,
    onResourceDeleted
}) => {
    const { addToast } = useToast();
    const [amenities, setAmenities] = useState<ResourceAmenity[]>([]);
    const [loading, setLoading] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showAddAmenity, setShowAddAmenity] = useState(false);
    const [selectedAmenity, setSelectedAmenity] = useState<ResourceAmenity | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const canManage = ['owner', 'admin'].includes(userRole || '');

    const fetchAmenities = async () => {
        if (!resource) return;
        
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('resource_amenities')
                .select(`
                    *,
                    amenities (
                        id,
                        name,
                        description
                    )
                `)
                .eq('resource_id', resource.id)
                .order('created_at');

            if (error) throw error;
            setAmenities(data || []);
        } catch (error) {
            console.error('Error fetching amenities:', error);
            addToast('Error fetching amenities', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show) {
            fetchAmenities();
        }
    }, [resource, show]);

    if (!resource) return null;

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header className="border-bottom position-relative">
                <div>
                    <button 
                        type="button" 
                        className="btn-close" 
                        onClick={onHide}
                        style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '1.5rem',
                            zIndex: 2
                        }}
                    />
                    {canManage && (
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setShowEditForm(true)}
                            style={{
                                position: 'absolute',
                                right: '3.5rem',
                                top: '1rem',
                                zIndex: 2
                            }}
                        >
                            <i className="fas fa-edit"></i>
                        </Button>
                    )}
                    <Offcanvas.Title>
                        <i className="fas fa-box me-2"></i>{resource.name}
                    </Offcanvas.Title>
                    <div className="text-muted" style={{ fontSize: '0.85em' }}>
                        View resource details
                    </div>
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <ListGroup variant="flush">
                    <ListGroup.Item>
                        <div className="text-muted mb-1">Description</div>
                        {resource.description}
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <div className="text-muted mb-1">Location</div>
                        <i className="fas fa-map-marker-alt me-2"></i>
                        {resource.location_description}
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <div className="text-muted mb-1">Maximum Occupants</div>
                        <i className="fas fa-users me-2"></i>
                        {resource.max_occupants}
                    </ListGroup.Item>

                    {/* Amenities Section */}
                    <ListGroup.Item>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="mb-0">
                                <i className="fas fa-star me-2"></i>Amenities
                            </h5>
                            {canManage && (
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => setShowAddAmenity(true)}
                                >
                                    <i className="fas fa-plus me-2"></i>Add Amenity
                                </Button>
                            )}
                        </div>
                        {loading ? (
                            <div className="text-center py-3">
                                <span className="spinner-border spinner-border-sm" role="status" />
                            </div>
                        ) : amenities.length === 0 ? (
                            <div className="text-muted text-center py-3">
                                No amenities available
                            </div>
                        ) : (
                            <ListGroup variant="flush">
                                {amenities.map(amenity => (
                                    <ListGroup.Item
                                        key={amenity.id}
                                        className="d-flex justify-content-between align-items-center py-2"
                                    >
                                        <div>
                                            <div>{amenity.name_override || amenity.amenities.name}</div>
                                            <small className="text-muted">
                                                {amenity.amenities.description}
                                            </small>
                                        </div>
                                        {canManage && (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedAmenity(amenity);
                                                    setShowDeleteConfirm(true);
                                                }}
                                            >
                                                <i className="fas fa-times"></i>
                                            </Button>
                                        )}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </ListGroup.Item>
                </ListGroup>
            </Offcanvas.Body>
                        <div className="border-top mx-n3 px-3 py-3 mt-auto">
                            <div className="d-flex justify-content-end">
                                <Button
                                    variant="light"
                                    onClick={onHide}
                                >
                                    <i className="fas fa-chevron-left me-2"></i>Back
                                </Button>
                            </div>
                        </div>

            <ResourceEditForm
                show={showEditForm}
                onHide={() => setShowEditForm(false)}
                resource={resource}
                onResourceUpdated={() => {
                    onResourceUpdated();
                    setShowEditForm(false);
                }}
                onResourceDeleted={onResourceDeleted}
            />

            <ResourceAmenityAddForm
                show={showAddAmenity}
                onHide={() => setShowAddAmenity(false)}
                resourceId={resource.id}
                onAmenityAdded={fetchAmenities}
            />

            {selectedAmenity && (
                <ResourceAmenityDeleteConfirmation
                    show={showDeleteConfirm}
                    onHide={() => {
                        setShowDeleteConfirm(false);
                        setSelectedAmenity(null);
                    }}
                    amenity={selectedAmenity}
                    onAmenityDeleted={fetchAmenities}
                />
            )}
        </Offcanvas>
    );
};