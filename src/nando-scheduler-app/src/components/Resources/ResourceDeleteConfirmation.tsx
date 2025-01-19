import React from 'react';
import { Offcanvas, Alert, Button } from 'react-bootstrap';
import { Resource } from '../../types/resource';

interface Props {
    show: boolean;
    onHide: () => void;
    resource: Resource;
    isDeleting: boolean;
    onConfirmDelete: () => void;
}

export const ResourceDeleteConfirmation: React.FC<Props> = ({
    show,
    onHide,
    resource,
    isDeleting,
    onConfirmDelete
}) => (
    <Offcanvas show={show} onHide={onHide} placement="end">
        <Offcanvas.Header closeButton className="border-bottom">
            <Offcanvas.Title className="text-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Delete Resource?
            </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
            <div className="mb-4">
                <h5>{resource.name}</h5>
                <p className="text-muted">{resource.description}</p>
            </div>

            <Alert variant="danger">
                <i className="fas fa-exclamation-circle me-2"></i>
                This will permanently delete:
                <ul className="mb-0 mt-2">
                    <li>All past, present, and future reservations</li>
                    <li>All associated resource amenities</li>
                    <li>All scheduling capabilities for this resource</li>
                </ul>
            </Alert>
            
            <p className="text-muted small mt-3">
                This action cannot be undone.
            </p>

            <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="light" onClick={onHide}>
                    <i className="fas fa-chevron-left me-2"></i>Back
                </Button>
                <Button
                    variant="danger"
                    onClick={onConfirmDelete}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Deleting...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-trash-alt me-2"></i>
                            Yes, Delete Resource
                        </>
                    )}
                </Button>
            </div>
        </Offcanvas.Body>
    </Offcanvas>
);