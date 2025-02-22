import React, { useState } from 'react';
import { Form, Button, Offcanvas } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';

interface Props {
  show: boolean;
  onHide: () => void;
  onTeamCreated: () => void;
  userId?: string;
}

export const TeamCreateForm: React.FC<Props> = ({
  show,
  onHide,
  onTeamCreated,
  userId
}) => {
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [validated, setValidated] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidated(true);

    if (!formData.name) {
      addToast('Name is required', 'error');
      return;
    }

    if (!formData.description) {
      addToast('Description is required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .rpc('create_team_with_owner', {
          _name: formData.name,
          _description: formData.description,
          _user_id: userId
        });

      if (error) throw error;

      addToast('Team created successfully', 'success');
      onHide();
      onTeamCreated();
      setFormData({ name: '', description: '' }); // Reset form
      setValidated(false);
    } catch (error: any) {
      console.error('Error creating team:', error);
      addToast(error.message || 'Error creating team', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Offcanvas show={show} onHide={onHide} placement="end">
      <Offcanvas.Header closeButton className="border-bottom">
        <div>
          <Offcanvas.Title>
            <i className="fas fa-plus me-2"></i>Create New Team
          </Offcanvas.Title>
          <div className="text-muted" style={{ fontSize: '0.85em' }}>
            Create a new team to manage locations and members
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
              placeholder="Enter team name"
              required
              isInvalid={validated && !formData.name}
            />
            <Form.Control.Feedback type="invalid">
              Please provide a name for the team.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter team description"
              required
              isInvalid={validated && !formData.name}
            />
            <Form.Control.Feedback type="invalid">
              Please provide a description for the team.
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
                Creating...
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