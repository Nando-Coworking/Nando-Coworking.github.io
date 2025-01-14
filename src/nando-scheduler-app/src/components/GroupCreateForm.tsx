import React, { useState } from 'react';
import { Form, Button, Offcanvas } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';

interface Props {
  show: boolean;
  onHide: () => void;
  onGroupCreated: () => void;
  userId?: string;
}

export const GroupCreateForm: React.FC<Props> = ({
  show,
  onHide,
  onGroupCreated,
  userId
}) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleCreateGroup = async () => {
    try {
      const { error } = await supabase
        .rpc('create_group_with_owner', {
          _name: formData.name,
          _description: formData.description,
          _user_id: userId
        });

      if (error) throw error;

      addToast('Group created successfully', 'success');
      onHide();
      onGroupCreated();
      setFormData({ name: '', description: '' }); // Reset form
    } catch (error: any) {
      console.error('Error creating group:', error);
      addToast(error.message || 'Error creating group', 'error');
    }
  };

  return (
    <Offcanvas show={show} onHide={onHide} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Create New Group</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </Form.Group>
          <Button onClick={handleCreateGroup}>
            Create Group
          </Button>
        </Form>
      </Offcanvas.Body>
    </Offcanvas>
  );
};