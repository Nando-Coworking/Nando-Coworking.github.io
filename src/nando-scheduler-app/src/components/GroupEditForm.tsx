import React, { useState } from 'react';
import { Offcanvas, Form, Button } from 'react-bootstrap';
import { Group } from '../types/group';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';

interface Props {
    show: boolean;
    onHide: () => void;
    group: Group | null;
    onGroupUpdated: () => void;
}

export const GroupEditForm: React.FC<Props> = ({
    show,
    onHide,
    group,
    onGroupUpdated
}) => {
    const { addToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        name: group?.name || '',
        description: group?.description || ''
    });

    React.useEffect(() => {
        if (group) {
            setFormData({
                name: group.name,
                description: group.description || ''
            });
        }
    }, [group]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setValidated(true);

        if (!formData.name || !formData.description) {
            addToast('Name and description are required', 'error');
            return;
        }

        if (!group) return;
        setIsSaving(true);
        
        try {
            const { error } = await supabase
                .from('groups')
                .update({
                    name: formData.name,
                    description: formData.description
                })
                .eq('id', group.id);

            if (error) throw error;

            group.name = formData.name;
            group.description = formData.description;

            addToast('Group updated successfully', 'success');
            onGroupUpdated();
            onHide();
            setValidated(false);
        } catch (error) {
            console.error('Error updating group:', error);
            addToast('Error updating group', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton className="border-bottom">
                <div>
                    <Offcanvas.Title>
                        <i className="fas fa-edit me-2"></i>Edit Group
                    </Offcanvas.Title>
                    <div className="text-muted" style={{ fontSize: '0.85em' }}>
                        Use the form below to modify the current group.
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
                            placeholder="Enter group name"
                            required
                            isInvalid={validated && !formData.name}
                        />
                        <Form.Control.Feedback type="invalid">
                            Please provide a name for the group.
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter group description"
                            required
                            isInvalid={validated && !formData.description}
                        />
                        <Form.Control.Feedback type="invalid">
                            Please provide a description for the group.
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
            </Offcanvas.Body>
        </Offcanvas>
    );
};