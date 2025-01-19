import React, { useState, useEffect } from 'react';
import { Offcanvas, Form, Button, Alert } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import { Resource } from '../../types/resource';
import { ResourceDeleteConfirmation } from './ResourceDeleteConfirmation';

interface Props {
    show: boolean;
    onHide: () => void;
    resource: Resource;
    onResourceUpdated: () => void;
    onResourceDeleted?: () => void;
}

export const ResourceEditForm: React.FC<Props> = ({
    show,
    onHide,
    resource,
    onResourceUpdated,
    onResourceDeleted
}) => {
    const { addToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        name: resource.name,
        description: resource.description,
        location_description: resource.location_description,
        max_occupants: resource.max_occupants
    });

    useEffect(() => {
        setFormData({
            name: resource.name,
            description: resource.description,
            location_description: resource.location_description,
            max_occupants: resource.max_occupants
        });
    }, [resource]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setValidated(true);

        if (!formData.name || !formData.description || !formData.location_description || !formData.max_occupants) {
            addToast('Please fill in all required fields', 'error');
            return;
        }

        if (formData.max_occupants < 1) {
            addToast('Maximum occupants must be at least 1', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('resources')
                .update(formData)
                .eq('id', resource.id);

            if (error) throw error;

            addToast('Resource updated successfully', 'success');
            onResourceUpdated();
            onHide();
        } catch (error) {
            console.error('Error updating resource:', error);
            addToast('Error updating resource', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('resources')
                .delete()
                .eq('id', resource.id);

            if (error) throw error;

            addToast('Resource deleted successfully', 'success');
            if (onResourceDeleted) onResourceDeleted();
            onHide();
        } catch (error) {
            console.error('Error deleting resource:', error);
            addToast('Error deleting resource', 'error');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <>
            <Offcanvas show={show} onHide={onHide} placement="end">
                <Offcanvas.Header closeButton className="border-bottom">
                    <div>
                        <Offcanvas.Title>
                            <i className="fas fa-box me-2"></i>Edit Resource
                        </Offcanvas.Title>
                        <div className="text-muted" style={{ fontSize: '0.85em' }}>
                            Edit the details of this resource
                        </div>
                    </div>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Form noValidate validated={validated} onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter resource name"
                                required
                                isInvalid={validated && !formData.name}
                            />
                            <Form.Control.Feedback type="invalid">
                                Please provide a name.
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Enter resource description"
                                required
                                isInvalid={validated && !formData.description}
                            />
                            <Form.Control.Feedback type="invalid">
                                Please provide a description.
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Location Description <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.location_description}
                                onChange={e => setFormData({ ...formData, location_description: e.target.value })}
                                placeholder="Enter location description"
                                required
                                isInvalid={validated && !formData.location_description}
                            />
                            <Form.Control.Feedback type="invalid">
                                Please provide a location description.
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Max Occupants <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="number"
                                min="1"
                                value={formData.max_occupants}
                                onChange={e => setFormData({ ...formData, max_occupants: parseInt(e.target.value) })}
                                required
                                isInvalid={validated && formData.max_occupants < 1}
                            />
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid number of occupants.
                            </Form.Control.Feedback>
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="light" onClick={onHide}>
                                <i className="fas fa-chevron-left me-2"></i>Back
                            </Button>
                            <Button 
                                variant="primary"
                                type="submit"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-save me-2"></i>Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </Form>

                    <hr className="my-4 border-danger" />
                    <div className="mt-4">
                        <h5 className="text-danger">Danger Zone</h5>
                        <Button
                            variant="outline-danger"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-100"
                        >
                            <i className="fas fa-trash-alt me-2"></i>Delete Resource<i className="fas fa-chevron-right ms-2"></i>
                        </Button>
                    </div>

                    {showDeleteConfirm && (
                        <ResourceDeleteConfirmation
                            show={showDeleteConfirm}
                            onHide={() => setShowDeleteConfirm(false)}
                            resource={resource}
                            isDeleting={isDeleting}
                            onConfirmDelete={handleDelete}
                        />
                    )}
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
};