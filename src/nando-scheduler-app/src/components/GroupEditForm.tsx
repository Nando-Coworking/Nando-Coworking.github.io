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
    const [formData, setFormData] = useState({
        name: group?.name || '',
        description: group?.description || ''
    });

    // Update form data when group changes
    React.useEffect(() => {
        if (group) {
            setFormData({
                name: group.name,
                description: group.description || ''
            });
        }
    }, [group]);

    const handleUpdateGroup = async () => {
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

            // Update the group object with new values before calling onGroupUpdated
            group.name = formData.name;
            group.description = formData.description;

            addToast('Group updated successfully', 'success');
            onGroupUpdated();
            onHide();
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
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Form.Group>
                    <div className="d-flex justify-content-end gap-2">
                        <Button variant="light" onClick={onHide}>
                            <i className="fas fa-arrow-left me-2"></i>Back
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleUpdateGroup}
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