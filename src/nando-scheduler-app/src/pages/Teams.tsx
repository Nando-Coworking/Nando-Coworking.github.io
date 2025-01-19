import React, { useState, useEffect } from 'react';
import { Container, Button, Card, Badge, Offcanvas, Form, ListGroup, Alert } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { TeamCard } from '../components/Team/TeamCard';
import { TeamDeleteConfirmation } from '../components/Team/TeamDeleteConfirmation';
import { TeamCreateForm } from '../components/Team/TeamCreateForm';
import { TeamAddMember } from '../components/Team/TeamAddMember';
import { TeamDetailsOffcanvas } from '../components/Team/TeamDetailsOffcanvas';
import { TeamEditForm } from '../components/Team/TeamEditForm';
import { TeamLeaveConfirmation } from '../components/Team/TeamLeaveConfirmation';
import { SiteAdd } from '../components/Sites/SiteAdd';
import { SiteEdit } from '../components/Sites/SiteEdit';

interface Team {
  id: string;
  name: string;
  description: string;
  member_count?: number;
  user_role?: string;
}

interface TeamUser {
  id: string;
  user_id: string;
  email: string;
  role: string;
}

const Teams: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [showAddSite, setShowAddSite] = useState(false);
  const [showEditSite, setShowEditSite] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Add new state for editing
  const [showEditForm, setShowEditForm] = useState(false);

  // Add new state variables after other state declarations
  const [isSavingChanges, setIsSavingChanges] = useState(false);

  // Add new state
  const [showAddMember, setShowAddMember] = useState(false);

  // Add new state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update state
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  // Add this with other state declarations
  const [editingTeam, setEditingTeam] = useState({
    name: '',
    description: ''
  });

  // Add state for leave confirmation
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeavingTeam, setIsLeavingTeam] = useState(false);


  const fetchTeams = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_team_with_member_count', {
          _user_id: user.id
        });

      if (error) throw error;

      setTeams(data);
    } catch (error) {
      addToast('Error fetching teams', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamUsers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_team_members', {
          _team_id: teamId
        });

      if (error) throw error;

      setTeamUsers(data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        role: item.role,
        email: item.email
      })));
    } catch (error) {
      console.error('Error fetching team members:', error);
      addToast('Error fetching team members', 'error');
    }
  };

  const fetchSites = async (teamId: string) => {
      try {
          const { data, error } = await supabase
              .from('sites')
              .select('*')
              .eq('team_id', teamId);
  
          if (error) throw error;
          setSites(data);
      } catch (error) {
          console.error('Error fetching sites:', error);
          addToast('Error fetching sites', 'error');
      }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTeams();
    }
  }, [user]);

  const handleAddUser = async () => {
    if (!selectedTeam) return;
    setIsAddingMember(true);
    try {
      // Use RPC to get user ID by email
      const { data: userId, error: userError } = await supabase
        .rpc('get_user_id_by_email', {
          _email: newEmail
        });

      if (userError) throw userError;

      if (!userId) {
        addToast('User not found with that email', 'error');
        return;
      }

      const { error } = await supabase
        .from('team_users')
        .insert([{
          team_id: selectedTeam.id,
          user_id: userId,
          role: newRole
        }]);

      if (error) throw error;

      addToast('User added successfully', 'success');
      fetchTeamUsers(selectedTeam.id);
      fetchTeams(); // Add this line
      setNewEmail('');
    } catch (error) {
      console.error('Error adding user:', error);
      addToast('Error adding user', 'error');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!selectedTeam) return;

    try {
      const { error } = await supabase
        .from('team_users')
        .delete()
        .eq('team_id', selectedTeam.id)
        .eq('user_id', userId);

      if (error) throw error;

      addToast('User removed successfully', 'success');
      fetchTeamUsers(selectedTeam.id);
      fetchTeams(); // Add this line
    } catch (error) {
      addToast('Error removing user', 'error');
    }
  };

  // Add handler for team updates
  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;
    setIsSavingChanges(true);
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: editingTeam.name,
          description: editingTeam.description
        })
        .eq('id', selectedTeam.id)
        .select() // Add this to get the updated record
        .single(); // Add this to get a single record

      if (error) throw error;

      // Update the selected team in memory with the new values
      setSelectedTeam({
        ...selectedTeam,
        name: editingTeam.name,
        description: editingTeam.description
      });

      addToast('Team updated successfully', 'success');
      fetchTeams();
    } catch (error) {
      console.error('Error updating team:', error);
      addToast('Error updating team', 'error');
    } finally {
      setIsSavingChanges(false);
    }
  };

  // Add handler for slide-out close
  const handleTeamDetailsClose = () => {
    setShowTeamDetails(false);
    fetchTeams(); // Refresh teams to update member count
  };

  const handleTeamDetailsOpen = (team: Team) => {
    setSelectedTeam(team);
    setEditingTeam({
      name: team.name,
      description: team.description || ''
    });
    fetchTeamUsers(team.id);
    fetchSites(team.id);
    setShowTeamDetails(true);
  };

  // Add role priority mapping
  const rolePriority = {
    'owner': 0,
    'admin': 1,
    'member': 2
  };

  // Update handler
  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;
    setIsDeletingTeam(true);

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', selectedTeam.id);

      if (error) throw error;

      addToast('Team deleted successfully', 'success');
      setShowDeleteConfirm(false);
      setShowTeamDetails(false);
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      addToast('Error deleting team', 'error');
    } finally {
      setIsDeletingTeam(false);
    }
  };

  // Add new handlers
  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!selectedTeam) return;

    try {
      const { error } = await supabase
        .from('team_users')
        .update({ role: newRole })
        .eq('team_id', selectedTeam.id)
        .eq('user_id', userId);

      if (error) throw error;

      addToast('Role updated successfully', 'success');
      fetchTeamUsers(selectedTeam.id);
      fetchTeams();
    } catch (error) {
      console.error('Error updating role:', error);
      addToast('Error updating role', 'error');
    }
  };

  // Update handleLeaveTeam
  const handleLeaveTeam = async () => {
    if (!selectedTeam || !user?.id) return;
    setIsLeavingTeam(true);

    try {
      const { error } = await supabase
        .from('team_users')
        .delete()
        .eq('team_id', selectedTeam.id)
        .eq('user_id', user.id);

      if (error) throw error;

      addToast('Left team successfully', 'success');
      setShowLeaveConfirm(false);
      setShowTeamDetails(false);
      fetchTeams();
    } catch (error) {
      console.error('Error leaving team:', error);
      addToast('Error leaving team', 'error');
    } finally {
      setIsLeavingTeam(false);
    }
  };

  // Add handler for removing sites
  const handleRemoveSite = async (siteId: string) => {
    if (!selectedTeam) return;
    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', siteId);

      if (error) throw error;

      addToast('Site removed successfully', 'success');
      fetchSites(selectedTeam.id);
    } catch (error) {
      console.error('Error removing site:', error);
      addToast('Error removing site', 'error');
    }
  };

  // Helper function for permission checks
  const canManageMembers = (role?: string) => ['owner', 'admin'].includes(role || '');
  const isOwner = (role?: string) => role === 'owner';

  return (
    <>
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3><i className="fas fa-users me-2"></i>My Teams</h3>
          {!loading && teams.length > 0 && (
            <Button onClick={() => setShowTeamForm(true)}>
              <i className="fas fa-plus me-2"></i>Create Team
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center">
            <span className="spinner-border" role="status" />
          </div>
        ) : teams.length === 0 ? (
          <Alert variant="light" className="text-center p-5 border">
            <div className="mb-3">
              <i className="fas fa-users fa-3x text-muted"></i>
            </div>
            <h4>No Teams Yet</h4>
            <p className="text-muted mb-4">
              You haven't created or joined any teams yet. Teams help you organize your coworking spaces and members.
            </p>
            <Button
              variant="primary"
              onClick={() => setShowTeamForm(true)}
            >
              <i className="fas fa-plus me-2"></i>Create Your First Team
            </Button>
          </Alert>
        ) : (
          <div className="row g-4">
            {teams.map(team => (
              <div key={team.id} className="col-md-6 col-lg-4">
                <TeamCard
                  team={team}
                  onManage={handleTeamDetailsOpen}
                />
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* Create/Edit Team Offcanvas */}
      <TeamCreateForm
        show={showTeamForm}
        onHide={() => setShowTeamForm(false)}
        onTeamCreated={fetchTeams}
        userId={user?.id}
      />

      {/* Team Details Offcanvas */}
      <TeamDetailsOffcanvas
        show={showTeamDetails}
        onHide={handleTeamDetailsClose}
        selectedTeam={selectedTeam}
        teamUsers={teamUsers}
        onEditClick={() => setShowEditForm(true)}
        onDeleteClick={() => setShowDeleteConfirm(true)}
        onAddMemberClick={() => setShowAddMember(true)}
        onRemoveUser={handleRemoveUser}
        onRoleChange={handleRoleChange}
        onLeaveTeam={handleLeaveTeam}
        rolePriority={rolePriority}
        onShowLeaveConfirm={() => setShowLeaveConfirm(true)}
        sites={sites} // Add this line
        onAddSite={() => setShowAddSite(true)} // Add these handlers
        onEditSite={(site) => {
          setSelectedSite(site);
          setShowEditSite(true);
        }}
        onRemoveSite={handleRemoveSite}
      />

      {/* Add Member Offcanvas */}
      <Offcanvas
        show={showAddMember}
        onHide={() => setShowAddMember(false)}
        placement="end"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Add Member to {selectedTeam?.name}</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                variant="light"
                onClick={() => setShowAddMember(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={isAddingMember}
              >
                {isAddingMember ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Adding...
                  </>
                ) : (
                  'Add Member'
                )}
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Add new Delete Confirmation Offcanvas */}
      <TeamDeleteConfirmation
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        teamName={selectedTeam?.name || ''}
        teamDescription={selectedTeam?.description || ''}
        teamUsers={teamUsers}
        isDeleting={isDeletingTeam}
        onConfirmDelete={handleDeleteTeam}
      />

      {/* Add Member Component */}
      <TeamAddMember
        show={showAddMember}
        onHide={() => setShowAddMember(false)}
        selectedTeam={selectedTeam}
        onMemberAdded={() => {
          fetchTeamUsers(selectedTeam?.id || '');
          fetchTeams();
        }}
      />

      <TeamEditForm
        show={showEditForm}
        onHide={() => setShowEditForm(false)}
        team={selectedTeam}
        onTeamUpdated={() => {
          // First update the selected team with new values
          if (selectedTeam) {
            setSelectedTeam({
              ...selectedTeam,
              name: selectedTeam.name,
              description: selectedTeam.description
            });
          }
          // Then refresh the data
          fetchTeams();
          fetchTeamUsers(selectedTeam?.id || '');
        }}
      />

      <TeamLeaveConfirmation
        show={showLeaveConfirm}
        onHide={() => setShowLeaveConfirm(false)}
        teamName={selectedTeam?.name || ''}
        teamDescription={selectedTeam?.description || ''}
        isLeaving={isLeavingTeam}
        onConfirmLeave={handleLeaveTeam}
      />

      <SiteAdd
        show={showAddSite}
        onHide={() => setShowAddSite(false)}
        team={selectedTeam}
        onSiteAdded={() => {
          fetchSites(selectedTeam?.id || '');
        }}
      />

      <SiteEdit
          show={showEditSite}
          onHide={() => setShowEditSite(false)}
          site={selectedSite}
          onSiteUpdated={() => {
              fetchSites(selectedTeam?.id || '');
          }}
          onSiteDeleted={() => {
              fetchSites(selectedTeam?.id || '');
              setSelectedSite(null); // Clear the selected site
              setShowEditSite(false); // Close the edit site offcanvas
          }}
      />

    </>
  );
};

export default Teams;