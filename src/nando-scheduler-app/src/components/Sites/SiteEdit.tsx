import React, { useState, useEffect } from 'react';
import { Offcanvas, Form, Button, Alert } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import { Site } from '../../types/site';
import { useAuth } from '../../AuthContext';
import { Team } from '../../types/team';

interface Props {
    show: boolean;
    onHide: () => void;
    site: Site | null;
    onSiteUpdated: () => void;
    onSiteDeleted: () => void; // Add this prop
}

export const SiteEdit: React.FC<Props> = ({
    show,
    onHide,
    site,
    onSiteUpdated,
    onSiteDeleted // Add this prop
}) => {
    const { user } = useAuth();  // Add this line
    const { addToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false); // Add this state
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
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');

    useEffect(() => {
        if (site) {
            setFormData({
                name: site.name || '',
                description: site.description || '',
                address1: site.address1 || '',
                address2: site.address2 || '',
                city: site.city || '',
                state: site.state || '',
                postal_code: site.postal_code || '',
                phone: site.phone || ''
            });
        }
    }, [site]);

    useEffect(() => {
        if (site) {
            setSelectedTeamId(site.team_id);
        }
    }, [site]);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                if (!user?.id) return;

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

        fetchTeams();
    }, [user]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setValidated(true);

        if (!formData.name || !formData.city || !formData.state || !selectedTeamId) {
            addToast('Name, City, State, and Team are required fields', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('sites')
                .update({
                    ...formData,
                    team_id: selectedTeamId,
                    slug_name: formData.name.toLowerCase().replace(/\s+/g, '-')
                })
                .eq('id', site.id);

            if (error) throw error;

            addToast('Site updated successfully', 'success');
            onSiteUpdated();
            onHide();
        } catch (error) {
            console.error('Error updating site:', error);
            addToast('Error updating site', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!site) return;
    
        console.log('Starting deletion for site:', site); // Log entire site object
        
        setIsDeleting(true);
        try {
            // Simplified delete query
            const { data, error } = await supabase
                .from('sites')
                .delete()
                .eq('id', site.id)
                .single(); // Expect single row deletion
    
            if (error) {
                console.error('Supabase deletion error:', error);
                throw error;
            }
    
            // Verify deletion
            const { data: checkData } = await supabase
                .from('sites')
                .select()
                .eq('id', site.id)
                .single();
    
            if (checkData) {
                console.error('Site still exists after deletion');
                throw new Error('Deletion failed - site still exists');
            }
    
            console.log('Site successfully deleted:', data);
            addToast('Site deleted successfully', 'success');
            onSiteDeleted();
            onHide();
        } catch (error) {
            console.error('Error deleting location:', error);
            addToast('Error deleting location', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton className="border-bottom">
                <div>
                    <Offcanvas.Title>
                        <i className="fas fa-building me-2"></i>Edit Site
                    </Offcanvas.Title>
                    <div className="text-muted" style={{ fontSize: '0.85em' }}>
                        Update the details for this location
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
                            placeholder="Enter location name"
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
                            placeholder="Enter location description"
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

                    <Form.Group className="mb-3">
                        <Form.Label>Team <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            required
                            isInvalid={validated && !selectedTeamId}
                        >
                            <option value="">Select a team...</option>
                            {teams.map(team => (
                                <option 
                                    key={team.id} 
                                    value={team.id}
                                    defaultValue={team.id === site?.team_id}
                                >
                                    {team.name}
                                </option>
                            ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            Please select a team
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

                    <Alert variant="danger">
                <i className="fas fa-exclamation-circle me-2"></i>
                This will permanently delete:
                <ul className="mb-0 mt-2">
                    <li>All associated resources</li>
                    <li>All associated resource amenities</li>
                    <li>All past, present, and future reservations for those resources</li>
                </ul>
            </Alert>

                    <Button
                        variant="outline-danger"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-trash-alt me-2"></i>Permanently Delete Site
                            </>
                        )}
                    </Button>
                </div>
            </Offcanvas.Body>
        </Offcanvas>
    );
};