import React, { useState } from 'react';
import { Offcanvas, Button, Alert } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';
import { ResourceAmenity } from '../types/resourceamenity';

interface Props {
    show: boolean;
    onHide: () => void;
    amenity: ResourceAmenity;
    onAmenityDeleted: () => void;
}

export const ResourceAmenityDeleteConfirmation: React.FC<Props> = ({
    show,
    onHide,
    amenity,
    onAmenityDeleted
}) => {
    const { addToast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('resource_amenities')
                .delete()
                .eq('id', amenity.id);

            if (error) throw error;

            addToast('Amenity removed successfully', 'success');
            onAmenityDeleted();
            onHide();
        } catch (error) {
            console.error('Error removing amenity:', error);
            addToast('Error removing amenity', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton className="border-bottom">
                <Offcanvas.Title className="text-danger">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Remove Amenity?
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <div className="mb-4">
                    <h5>{amenity.name_override || amenity.amenities.name}</h5>
                    <p className="text-muted">{amenity.amenities.description}</p>
                </div>

                <Alert variant="warning">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    This will remove this amenity from the resource. The amenity will still be available to add to other resources.
                </Alert>

                <div className="d-flex justify-content-end gap-2 mt-4">
                    <Button variant="light" onClick={onHide}>
                        <i className="fas fa-chevron-left me-2"></i>Back
                    </Button>
                    <Button
                        variant="warning"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Removing...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-times me-2"></i>
                                Yes, Remove Amenity
                            </>
                        )}
                    </Button>
                </div>
            </Offcanvas.Body>
        </Offcanvas>
    );
};