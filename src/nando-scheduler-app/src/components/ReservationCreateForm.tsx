import React, { useState, useEffect } from 'react';
import { Offcanvas, Form, Button } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';
import { useAuth } from '../AuthContext';
import moment from 'moment';

interface Props {
  show: boolean;
  onHide: () => void;
  onReservationCreated: () => void;
  initialValues?: {
    team_id?: string;
    site_id?: string;
    resource_id?: string;
    start_time?: string;
    end_time?: string;
  };
}

export const ReservationCreateForm: React.FC<Props> = ({
  show,
  onHide,
  onReservationCreated,
  initialValues
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [validated, setValidated] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    // Set default times in local timezone
    start_time: moment().local().format('YYYY-MM-DDTHH:mm'),
    end_time: moment().local().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
    resource_id: '',
    team_id: '',
    site_id: '',
    participants: [] as string[]
  });

  // Fetch teams where user is a member
  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_users!inner (role)
        `)
        .eq('team_users.user_id', user?.id);

      if (error) {
        console.error('Error fetching teams:', error);
        return;
      }
      setTeams(data || []);
    };

    if (show) fetchTeams();
  }, [show, user]);

  // Fetch sites when team selected
  useEffect(() => {
    const fetchSites = async () => {
      if (!formData.team_id) return;
      
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('team_id', formData.team_id);

      if (error) {
        console.error('Error fetching sites:', error);
        return;
      }
      setSites(data || []);
    };

    fetchSites();
  }, [formData.team_id]);

  // Fetch resources when site selected
  useEffect(() => {
    const fetchResources = async () => {
      if (!formData.site_id) return;
      
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('site_id', formData.site_id);

      if (error) {
        console.error('Error fetching resources:', error);
        return;
      }
      setResources(data || []);
    };

    fetchResources();
  }, [formData.site_id]);

  // Set initial form data using the props
  useEffect(() => {
    if (show && initialValues) {
      // Set form data with initialValues when form opens
      setFormData(prev => ({
        ...prev,
        team_id: initialValues.team_id || '',
        site_id: initialValues.site_id || '',
        resource_id: initialValues.resource_id || '',
        start_time: initialValues.start_time || prev.start_time,
        end_time: initialValues.end_time || prev.end_time
      }));

      // Trigger site and resource fetching right away if we have team_id/site_id
      if (initialValues.team_id) {
        const fetchSites = async () => {
          const { data, error } = await supabase
            .from('sites')
            .select('*')
            .eq('team_id', initialValues.team_id);

          if (error) {
            console.error('Error fetching sites:', error);
            return;
          }
          setSites(data || []);
        };
        fetchSites();
      }

      if (initialValues.site_id) {
        const fetchResources = async () => {
          const { data, error } = await supabase
            .from('resources')
            .select('*')
            .eq('site_id', initialValues.site_id);

          if (error) {
            console.error('Error fetching resources:', error);
            return;
          }
          setResources(data || []);
        };
        fetchResources();
      }
    }
  }, [show, initialValues]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidated(true);

    if (!formData.title || !formData.resource_id || !formData.start_time || !formData.end_time) {
      return;
    }

    setIsSaving(true);
    try {
      // Convert local input times to UTC for storage
      const utcStart = moment(formData.start_time).local().utc().format();
      const utcEnd = moment(formData.end_time).local().utc().format();

      const { error } = await supabase
        .from('reservations')
        .insert([{
          title: formData.title,
          description: formData.description,
          start_time: utcStart,
          end_time: utcEnd,
          resource_id: formData.resource_id,
          user_id: user?.id,
          participants: formData.participants || []
        }]);

      if (error) throw error;
      
      onReservationCreated();
      onHide();
    } catch (error) {
      console.error('Error creating reservation:', error);
      addToast('Error creating reservation', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Offcanvas show={show} onHide={onHide} placement="end">
      <Offcanvas.Header closeButton className="border-bottom">
        <div>
          <Offcanvas.Title>
            <i className="fas fa-calendar-plus me-2"></i>Create Reservation
          </Offcanvas.Title>
          <div className="text-muted" style={{ fontSize: '0.85em' }}>
            Schedule a new reservation
          </div>
        </div>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Team <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={formData.team_id}
              onChange={e => setFormData({ ...formData, team_id: e.target.value, site_id: '', resource_id: '' })}
              required
            >
              <option value="">Select a team...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Site <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={formData.site_id}
              onChange={e => setFormData({ ...formData, site_id: e.target.value, resource_id: '' })}
              required
              disabled={!formData.team_id}
            >
              <option value="">Select a site...</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Resource <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={formData.resource_id}
              onChange={e => setFormData({ ...formData, resource_id: e.target.value })}
              required
              disabled={!formData.site_id}
            >
              <option value="">Select a resource...</option>
              {resources.map(resource => (
                <option key={resource.id} value={resource.id}>{resource.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Title <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
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

          <Form.Group className="mb-3">
            <Form.Label>Start Time <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="datetime-local"
              value={formData.start_time}
              onChange={e => setFormData({ ...formData, start_time: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>End Time <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="datetime-local"
              value={formData.end_time}
              onChange={e => setFormData({ ...formData, end_time: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Participants (Email Addresses)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter email addresses separated by commas"
              onChange={e => setFormData({
                ...formData,
                participants: e.target.value.split(',').map(email => email.trim())
              })}
            />
            <Form.Text className="text-muted">
              These users will be able to view the reservation details
            </Form.Text>
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
}