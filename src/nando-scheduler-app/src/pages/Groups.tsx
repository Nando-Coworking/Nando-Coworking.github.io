// src/pages/Groups.tsx
import React, { useState, useEffect } from 'react';
import { Container, Button, Card, Badge, Offcanvas, Form, ListGroup, Alert } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

interface Group {
  id: string;
  name: string;
  description: string;
  member_count?: number;
  user_role?: string;
}

interface GroupUser {
  id: string;
  user_id: string;
  email: string;
  role: string;
}

const Groups: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [groupUsers, setGroupUsers] = useState<GroupUser[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('member');

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Add new state for editing
  const [editingGroup, setEditingGroup] = useState({
    name: '',
    description: ''
  });

  // Add new state variables after other state declarations
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);

  // Add new state
  const [showAddMember, setShowAddMember] = useState(false);

  // Add new state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update state
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const fetchGroups = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_group_with_member_count', {
          _user_id: user.id
        });

      if (error) throw error;

      setGroups(data);
    } catch (error) {
      addToast('Error fetching groups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupUsers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_group_members', {
          _group_id: groupId
        });

      if (error) throw error;

      setGroupUsers(data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        role: item.role,
        email: item.email
      })));
    } catch (error) {
      console.error('Error fetching group members:', error);
      addToast('Error fetching group members', 'error');
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchGroups();
    }
  }, [user]);

  const handleCreateGroup = async () => {
    try {
      const { data, error } = await supabase
        .rpc('create_group_with_owner', {
          _name: formData.name,
          _description: formData.description,
          _user_id: user?.id
        });

      if (error) throw error;

      addToast('Group created successfully', 'success');
      setShowGroupForm(false);
      fetchGroups();
    } catch (error: any) {
      console.error('Error creating group:', error);
      addToast(error.message || 'Error creating group', 'error');
    }
  };

  const handleAddUser = async () => {
    if (!selectedGroup) return;
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
        .from('group_users')
        .insert([{
          group_id: selectedGroup.id,
          user_id: userId,
          role: newRole
        }]);

      if (error) throw error;

      addToast('User added successfully', 'success');
      fetchGroupUsers(selectedGroup.id);
      fetchGroups(); // Add this line
      setNewEmail('');
    } catch (error) {
      console.error('Error adding user:', error);
      addToast('Error adding user', 'error');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      const { error } = await supabase
        .from('group_users')
        .delete()
        .eq('group_id', selectedGroup.id)
        .eq('user_id', userId);

      if (error) throw error;

      addToast('User removed successfully', 'success');
      fetchGroupUsers(selectedGroup.id);
      fetchGroups(); // Add this line
    } catch (error) {
      addToast('Error removing user', 'error');
    }
  };

  // Add handler for group updates
  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;
    setIsSavingChanges(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({
          name: editingGroup.name,
          description: editingGroup.description
        })
        .eq('id', selectedGroup.id);

      if (error) throw error;
      
      addToast('Group updated successfully', 'success');
      fetchGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      addToast('Error updating group', 'error');
    } finally {
      setIsSavingChanges(false);
    }
  };

  // Add handler for slide-out close
  const handleGroupDetailsClose = () => {
    setShowGroupDetails(false);
    fetchGroups(); // Refresh groups to update member count
  };

  const handleGroupDetailsOpen = (group: Group) => {
    setSelectedGroup(group);
    setEditingGroup({
      name: group.name,
      description: group.description || ''  // Handle null description
    });
    fetchGroupUsers(group.id);
    setShowGroupDetails(true);
  };

  // Add role priority mapping
  const rolePriority = {
    'owner': 0,
    'admin': 1,
    'member': 2
  };

  // Update handler
  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    setIsDeletingGroup(true);
    
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', selectedGroup.id);

      if (error) throw error;
      
      addToast('Group deleted successfully', 'success');
      setShowDeleteConfirm(false);
      setShowGroupDetails(false);
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      addToast('Error deleting group', 'error');
    } finally {
      setIsDeletingGroup(false);
    }
  };

  // Add new handlers
  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!selectedGroup) return;
  
    try {
      const { error } = await supabase
        .from('group_users')
        .update({ role: newRole })
        .eq('group_id', selectedGroup.id)
        .eq('user_id', userId);
  
      if (error) throw error;
  
      addToast('Role updated successfully', 'success');
      fetchGroupUsers(selectedGroup.id);
      fetchGroups();
    } catch (error) {
      console.error('Error updating role:', error);
      addToast('Error updating role', 'error');
    }
  };
  
  const handleLeaveGroup = async () => {
    if (!selectedGroup || !user?.id || 
        !window.confirm('Are you sure you want to leave this group?')) {
      return;
    }
  
    try {
      const { error } = await supabase
        .from('group_users')
        .delete()
        .eq('group_id', selectedGroup.id)
        .eq('user_id', user.id);
  
      if (error) throw error;
  
      addToast('Left group successfully', 'success');
      setShowGroupDetails(false);
      fetchGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      addToast('Error leaving group', 'error');
    }
  };

  // Helper function for permission checks
  const canManageMembers = (role?: string) => ['owner', 'admin'].includes(role || '');
  const isOwner = (role?: string) => role === 'owner';

  return (
    <>
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3><i className="fas fa-users me-2"></i>My Groups</h3>
          {!loading && groups.length > 0 && (
            <Button onClick={() => setShowGroupForm(true)}>
              <i className="fas fa-plus me-2"></i>Create Group
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center">
            <span className="spinner-border" role="status" />
          </div>
        ) : groups.length === 0 ? (
          <Alert variant="light" className="text-center p-5 border">
            <div className="mb-3">
              <i className="fas fa-users fa-3x text-muted"></i>
            </div>
            <h4>No Groups Yet</h4>
            <p className="text-muted mb-4">
              You haven't created or joined any groups yet. Groups help you organize your coworking spaces and members.
            </p>
            <Button 
              variant="primary" 
              onClick={() => setShowGroupForm(true)}
            >
              <i className="fas fa-plus me-2"></i>Create Your First Group
            </Button>
          </Alert>
        ) : (
          <div className="row g-4">
            {groups.map(group => (
              <div key={group.id} className="col-md-6 col-lg-4">
                <Card>
                  <Card.Body>
                    <Card.Title className="d-flex justify-content-between">
                      {group.name}
                      <Badge 
                        bg={group.user_role === 'owner' ? 'primary' : 
                            group.user_role === 'admin' ? 'warning' : 
                            'info'}
                        text={group.user_role === 'owner' ? undefined : 'dark'}
                      >
                        <i className={`fas fa-${
                          group.user_role === 'owner' ? 'power-off' : 
                          group.user_role === 'admin' ? 'lock' : 
                          'user'
                        } me-1`}></i>
                        {group.user_role}
                      </Badge>
                    </Card.Title>
                    <Card.Text>{group.description}</Card.Text>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        <i className="fas fa-user me-1"></i>
                        {group.member_count} members
                      </small>
                      <Button 
                        variant="outline-primary"
                        onClick={() => handleGroupDetailsOpen(group)}
                      >
                        Manage<i className="fas fa-chevron-right ms-2"></i>
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* Create/Edit Group Offcanvas */}
      <Offcanvas 
        show={showGroupForm} 
        onHide={() => setShowGroupForm(false)}
        placement="end"
      >
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

      {/* Group Details Offcanvas */}
      <Offcanvas 
        show={showGroupDetails} 
        onHide={handleGroupDetailsClose}
        placement="end"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>{selectedGroup?.name}</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {/* Group metadata section - only owner can edit */}
          {isOwner(selectedGroup?.user_role) ? (
            <Form className="mb-4">
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={editingGroup.name}
                  onChange={e => setEditingGroup({...editingGroup, name: e.target.value})}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editingGroup.description}
                  onChange={e => setEditingGroup({...editingGroup, description: e.target.value})}
                />
              </Form.Group>
              <Button 
                onClick={handleUpdateGroup}
                disabled={isSavingChanges}
              >
                {isSavingChanges ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </Form>
          ) : (
            <div className="mb-4">
              <h5>{selectedGroup?.name}</h5>
              <p className="text-muted">{selectedGroup?.description}</p>
            </div>
          )}

          <hr className="my-4" />

          <h5 className="mt-4">Members</h5>
          <ListGroup className="mb-3">
            {groupUsers
              .sort((a, b) => {
                // First compare by role priority
                const roleDiff = rolePriority[a.role as keyof typeof rolePriority] - 
                                rolePriority[b.role as keyof typeof rolePriority];
                
                // If same role, sort by email
                if (roleDiff === 0) {
                  return a.email.localeCompare(b.email);
                }
                
                return roleDiff;
              })
              .map(groupUser => (
                <ListGroup.Item 
                  key={groupUser.id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div>{groupUser.email}</div>
                    <Badge 
                      bg={groupUser.role === 'owner' ? 'primary' : 
                          groupUser.role === 'admin' ? 'warning' : 
                          'info'}
                      text={groupUser.role === 'owner' ? undefined : 'dark'}
                    >
                      <i className={`fas fa-${
                        groupUser.role === 'owner' ? 'power-off' : 
                        groupUser.role === 'admin' ? 'lock' : 
                        'user'
                      } me-1`}></i>
                      {groupUser.role}
                    </Badge>
                  </div>
                  <div>
                    {/* Show role dropdown for owners/admins */}
                    {canManageMembers(selectedGroup?.user_role) && 
                    groupUser.role !== 'owner' && 
                    groupUser.user_id !== user?.id && (
                      <Form.Select
                        size="sm"
                        value={groupUser.role}
                        onChange={(e) => handleRoleChange(groupUser.user_id, e.target.value)}
                        style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem' }}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </Form.Select>
                    )}

                    {/* Show Leave link for self, Remove button for others */}
                    {groupUser.user_id === user?.id ? (
                      groupUser.role !== 'owner' && (
                        <Button 
                          variant="link" 
                          className="text-danger p-0 border-0" 
                          onClick={handleLeaveGroup}
                        >
                          Leave Group
                        </Button>
                      )
                    ) : (
                      canManageMembers(selectedGroup?.user_role) && 
                      groupUser.role !== 'owner' && (
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleRemoveUser(groupUser.user_id)}
                        >
                          <i className="fas fa-times"></i>
                        </Button>
                      )
                    )}
                  </div>
                </ListGroup.Item>
              ))}
          </ListGroup>

          {/* Add member form - visible to owners and admins */}
          {canManageMembers(selectedGroup?.user_role) && (
            <Button 
              variant="primary"
              onClick={() => setShowAddMember(true)}
              className="mt-3"
            >
              <i className="fas fa-plus me-2"></i>
              Add Member
            </Button>
          )}

          {/* Danger zone - only for owners */}
          {isOwner(selectedGroup?.user_role) && (
            <>
              <hr className="my-4 border-danger" />
              <div className="mt-4">
                <Button 
                  variant="outline-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <i className="fas fa-trash-alt me-2"></i>
                  Delete Group
                </Button>
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Add Member Offcanvas */}
      <Offcanvas 
        show={showAddMember} 
        onHide={() => setShowAddMember(false)}
        placement="end"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Add Member to {selectedGroup?.name}</Offcanvas.Title>
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
      <Offcanvas 
        show={showDeleteConfirm} 
        onHide={() => setShowDeleteConfirm(false)}
        placement="end"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="text-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Delete Group?
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {/* Group Info */}
          <div className="mb-4">
            <h5>{selectedGroup?.name}</h5>
            <p className="text-muted">{selectedGroup?.description}</p>
          </div>

          {/* Members List */}
          <div className="mb-4">
            <h6>Current Members:</h6>
            <ListGroup variant="flush" className="mb-3">
              {groupUsers.map(groupUser => (
                <ListGroup.Item 
                  key={groupUser.id}
                  className="px-0 d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div>{groupUser.email}</div>
                    <Badge 
                      bg={groupUser.role === 'owner' ? 'primary' : 
                          groupUser.role === 'admin' ? 'warning' : 
                          'info'}
                      text={groupUser.role === 'owner' ? undefined : 'dark'}
                    >
                      <i className={`fas fa-${
                        groupUser.role === 'owner' ? 'power-off' : 
                        groupUser.role === 'admin' ? 'lock' : 
                        'user'
                      } me-1`}></i>
                      {groupUser.role}
                    </Badge>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>

          {/* Warning Section */}
          <Alert variant="danger">
            <i className="fas fa-exclamation-circle me-2"></i>
            This will permanently delete:
            <ul className="mb-0 mt-2">
              <li>All {groupUsers.length} members and their roles</li>
              <li>All associated sites</li>
              <li>All associated resources</li>
              <li>All reservations for those resources</li>
            </ul>
          </Alert>
          <p className="text-muted small mt-3">
            This action cannot be undone.
          </p>

          {/* Action Buttons */}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button 
              variant="light"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="danger"
              onClick={handleDeleteGroup}
              disabled={isDeletingGroup}
            >
              {isDeletingGroup ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="fas fa-trash-alt me-2"></i>
                  Yes, Delete Group
                </>
              )}
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Groups;