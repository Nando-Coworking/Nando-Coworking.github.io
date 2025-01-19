import React, { useState } from 'react';
import { Offcanvas, Form, Button } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import { Resource } from '../../types/resource';

interface Props {
    show: boolean;
    onHide: () => void;
    siteId: string;
    onResourceAdded: () => void;
}

export const ResourceAddForm: React.FC<Props> = ({
    show,
    onHide,
    siteId,
    onResourceAdded
}) => {
    const { addToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location_description: '',
        max_occupants: 1
    });

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
                .insert([{
                    ...formData,
                    site_id: siteId
                }]);

            if (error) throw error;

            addToast('Resource added successfully', 'success');
            onResourceAdded();
            setFormData({
                name: '',
                description: '',
                location_description: '',
                max_occupants: 1
            });
            onHide();
        } catch (error) {
            console.error('Error adding resource:', error);
            addToast('Error adding resource', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton className="border-bottom">
                <div>
                    <Offcanvas.Title>
                        <i className="fas fa-box me-2"></i>Add Resource
                    </Offcanvas.Title>
                    <div className="text-muted" style={{ fontSize: '0.85em' }}>
                        Add a new resource to this location
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
                            as="textarea"
                            rows={2}
                            value={formData.location_description}
                            onChange={e => setFormData({ ...formData, location_description: e.target.value })}
                            placeholder="Describe where this resource is located within the site"
                            required
                            isInvalid={validated && !formData.location_description}
                        />
                        <Form.Control.Feedback type="invalid">
                            Please describe where this resource is located.
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Maximum Occupants <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="number"
                            min="1"
                            value={formData.max_occupants}
                            onChange={e => setFormData({ ...formData, max_occupants: parseInt(e.target.value) || 0 })}
                            required
                            isInvalid={validated && formData.max_occupants < 1}
                        />
                        <Form.Control.Feedback type="invalid">
                            Maximum occupants must be at least 1.
                        </Form.Control.Feedback>
                    </Form.Group>
                </Form>
            </Offcanvas.Body>
            <div className="border-top mx-n3 px-3 py-3 mt-auto">
                <div className="d-flex justify-content-end">
                    <Button
                        variant="light"
                        onClick={onHide}
                        className="me-2"
                    >
                        <i className="fas fa-chevron-left me-2"></i>Back
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
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
            </div>
        </Offcanvas>
    );
};