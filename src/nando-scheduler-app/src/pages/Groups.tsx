// src/pages/Groups.tsx
import React, { useState, useEffect } from 'react';
import { Container, Button, Card, Badge, Offcanvas, Form, ListGroup, Alert } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { GroupCard } from '../components/GroupCard';
import { GroupDeleteConfirmation } from '../components/GroupDeleteConfirmation';
import { GroupCreateForm } from '../components/GroupCreateForm';
import { GroupAddMember } from '../components/GroupAddMember';
import { GroupDetailsOffcanvas } from '../components/GroupDetailsOffcanvas';
import { GroupEditForm } from '../components/GroupEditForm';
// Add import
import { GroupLeaveConfirmation } from '../components/GroupLeaveConfirmation';

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
  const [isAddingMember, setIsAddingMember] = useState(false);

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
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  // Add this with other state declarations
  const [editingGroup, setEditingGroup] = useState({
    name: '',
    description: ''
  });

  // Add state for leave confirmation
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);

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
        .eq('id', selectedGroup.id)
        .select() // Add this to get the updated record
        .single(); // Add this to get a single record

      if (error) throw error;
      
      // Update the selected group in memory with the new values
      setSelectedGroup({
        ...selectedGroup,
        name: editingGroup.name,
        description: editingGroup.description
      });
      
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
      description: group.description || ''
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
  
  // Update handleLeaveGroup
  const handleLeaveGroup = async () => {
    if (!selectedGroup || !user?.id) return;
    setIsLeavingGroup(true);
  
    try {
        const { error } = await supabase
            .from('group_users')
            .delete()
            .eq('group_id', selectedGroup.id)
            .eq('user_id', user.id);
  
        if (error) throw error;
  
        addToast('Left group successfully', 'success');
        setShowLeaveConfirm(false);
        setShowGroupDetails(false);
        fetchGroups();
    } catch (error) {
        console.error('Error leaving group:', error);
        addToast('Error leaving group', 'error');
    } finally {
        setIsLeavingGroup(false);
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
                <GroupCard 
                  group={group}
                  onManage={handleGroupDetailsOpen}
                />
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* Create/Edit Group Offcanvas */}
      <GroupCreateForm
        show={showGroupForm}
        onHide={() => setShowGroupForm(false)}
        onGroupCreated={fetchGroups}
        userId={user?.id}
      />

      {/* Group Details Offcanvas */}
      <GroupDetailsOffcanvas
        show={showGroupDetails}
        onHide={handleGroupDetailsClose}
        selectedGroup={selectedGroup}
        groupUsers={groupUsers}
        onEditClick={() => setShowEditForm(true)}
        onDeleteClick={() => setShowDeleteConfirm(true)}
        onAddMemberClick={() => setShowAddMember(true)}
        onRemoveUser={handleRemoveUser}
        onRoleChange={handleRoleChange}
        onLeaveGroup={handleLeaveGroup}
        rolePriority={rolePriority}
        onShowLeaveConfirm={() => setShowLeaveConfirm(true)}  // Add this line
      />

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
      <GroupDeleteConfirmation
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        groupName={selectedGroup?.name || ''}
        groupDescription={selectedGroup?.description || ''}
        groupUsers={groupUsers}
        isDeleting={isDeletingGroup}
        onConfirmDelete={handleDeleteGroup}
      />

      {/* Add Member Component */}
      <GroupAddMember
        show={showAddMember}
        onHide={() => setShowAddMember(false)}
        selectedGroup={selectedGroup}
        onMemberAdded={() => {
          fetchGroupUsers(selectedGroup?.id || '');
          fetchGroups();
        }}
      />

      <GroupEditForm
        show={showEditForm}
        onHide={() => setShowEditForm(false)}
        group={selectedGroup}
        onGroupUpdated={() => {
          // First update the selected group with new values
          if (selectedGroup) {
            setSelectedGroup({
              ...selectedGroup,
              name: selectedGroup.name,
              description: selectedGroup.description
            });
          }
          // Then refresh the data
          fetchGroups();
          fetchGroupUsers(selectedGroup?.id || '');
        }}
      />

      <GroupLeaveConfirmation
        show={showLeaveConfirm}
        onHide={() => setShowLeaveConfirm(false)}
        groupName={selectedGroup?.name || ''}
        groupDescription={selectedGroup?.description || ''}
        isLeaving={isLeavingGroup}
        onConfirmLeave={handleLeaveGroup}
      />
    </>
  );
};

export default Groups;