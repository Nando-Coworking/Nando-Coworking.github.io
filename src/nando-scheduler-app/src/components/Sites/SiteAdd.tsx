import React, { useState, useEffect } from 'react';
import { Offcanvas, Form, Button } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';
import { useAuth } from '../AuthContext'; // Add this import
import { Team } from '../types/team';

interface Props {
    show: boolean;
    onHide: () => void;
    team: Team | null;
    onSiteAdded: () => void;
}

export const SiteAdd: React.FC<Props> = ({
    show,
    onHide,
    team,
    onSiteAdded
}) => {
    const { user } = useAuth(); // Add this hook
    const { addToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        postal_code: '',
        phone: ''
    });
    const [validated, setValidated] = useState(false);

    // Add useEffect and state for teams
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                if (!user?.id) return; // Add this check

                const { data, error } = await supabase
                    .rpc('get_team_with_member_count', {
                        _user_id: user.id
                    });

                if (error) throw error;
                setTeams(data.filter(g => ['owner', 'admin'].includes(g.user_role || '')));
            } catch (error) {
                console.error('Error fetching teams:', error);
                addToast('Error fetching teams', 'error');
            }
        };

        if (!team) { // Only fetch teams if no team was passed in
            fetchTeams();
        } else {
            setSelectedTeamId(team.id);
        }
    }, [team, user]); // Add user to dependencies

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setValidated(true);

        const teamId = team?.id || selectedTeamId;
        if (!teamId) {
            addToast('Please select a team', 'error');
            return;
        }

        // Validate mandatory fields
        if (!formData.name || !formData.city || !formData.state) {
            addToast('Name, City, and State are required fields', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('sites')
                .insert([{
                    ...formData,
                    team_id: teamId,
                    slug_name: formData.name.toLowerCase().replace(/\s+/g, '-')
                }]);

            if (error) throw error;

            addToast('Site added successfully', 'success');
            onSiteAdded();
            setFormData({
                name: '',
                description: '',
                address1: '',
                address2: '',
                city: '',
                state: '',
                postal_code: '',
                phone: ''
            });
            onHide();
        } catch (error) {
            console.error('Error adding site:', error);
            addToast('Error adding site', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton className="border-bottom">
                <div>
                    <Offcanvas.Title>
                        <i className="fas fa-building me-2"></i>Add Site
                    </Offcanvas.Title>
                    <div className="text-muted" style={{ fontSize: '0.85em' }}>
                        {team ?
                            `Add a new site to ${team.name}` :
                            'Add a new site to one of your teams'
                        }
                    </div>
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    {!team && (
                        <Form.Group className="mb-3">
                            <Form.Label>Team <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                                value={selectedTeamId}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                required
                                isInvalid={validated && !selectedTeamId}
                            >
                                <option value="">Select a team...</option>
                                {teams.map(g => (
                                    <option key={g.id} value={g.id}>
                                        {g.name}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                Please select a team.
                            </Form.Control.Feedback>
                        </Form.Group>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter site name"
                            required
                            isInvalid={validated && !formData.name}
                        />
                        <Form.Control.Feedback type="invalid">
                            Please provide a name.
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter site description"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Address Line 1</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.address1}
                            onChange={e => setFormData({ ...formData, address1: e.target.value })}
                            placeholder="Enter street address"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Address Line 2</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.address2}
                            onChange={e => setFormData({ ...formData, address2: e.target.value })}
                            placeholder="Suite, Unit, Building (optional)"
                        />
                    </Form.Group>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>City <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="Enter city"
                                    required
                                    isInvalid={validated && !formData.city}
                                />
                                <Form.Control.Feedback type="invalid">
                                    Please provide a city.
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                        <div className="col-md-3">
                            <Form.Group className="mb-3">
                                <Form.Label>State <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                    placeholder="ST"
                                    required
                                    isInvalid={validated && !formData.state}
                                />
                                <Form.Control.Feedback type="invalid">
                                    Please provide a state.
                                </Form.Control.Feedback>
                            </Form.Group>
                        </div>
                        <div className="col-md-3">
                            <Form.Group className="mb-3">
                                <Form.Label>ZIP Code</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.postal_code}
                                    onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
                                    placeholder="12345"
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Enter phone number"
                        />
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
                        type="submit"
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