import React, { useState } from 'react';
import { Offcanvas, Form, Button, ListGroup, Badge } from 'react-bootstrap';
import { Team, TeamUser } from '../types/team';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { TeamMemberEdit } from './TeamMemberEdit';
import { Site } from '../types/site';

interface Props {
    show: boolean;
    onHide: () => void;
    selectedTeam: Team | null;
    teamUsers: TeamUser[];
    editingTeam: {
        name: string;
        description: string;
    };
    setEditingTeam: React.Dispatch<React.SetStateAction<{
        name: string;
        description: string;
    }>>;
    isSavingChanges: boolean;
    onUpdateTeam: () => Promise<void>;
    onDeleteClick: () => void;
    onAddMemberClick: () => void;
    onRemoveUser: (userId: string) => Promise<void>;
    onRoleChange: (userId: string, newRole: string) => Promise<void>;
    onLeaveTeam: () => Promise<void>;
    rolePriority: Record<string, number>;
    onEditClick: () => void;
    onShowLeaveConfirm: () => void;

    sites: Site[];
    onAddSite: () => void;
    onEditSite: (site: Site) => void;
    onRemoveSite: (siteId: string) => Promise<void>;
}

export const TeamDetailsOffcanvas: React.FC<Props> = ({
    show,
    onHide,
    selectedTeam,
    teamUsers,
    editingTeam,
    setEditingTeam,
    isSavingChanges,
    onUpdateTeam,
    onDeleteClick,
    onAddMemberClick,
    onRemoveUser,
    onRoleChange,
    onLeaveTeam,
    rolePriority,
    onEditClick,
    onShowLeaveConfirm,
    sites = [],
    onAddSite,
    onEditSite,
    onRemoveSite
}) => {
    const { user } = useAuth();
    const canManageMembers = (role?: string) => ['owner', 'admin'].includes(role || '');
    const isOwner = (role?: string) => role === 'owner';

    // Add state for member editing
    const [editingMember, setEditingMember] = useState<TeamUser | null>(null);

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton className="border-bottom">
                <div>
                    <Offcanvas.Title>
                        <i className="fas fa-cog me-2"></i>Manage Team
                    </Offcanvas.Title>
                    <div className="text-muted" style={{ fontSize: '0.85em' }}>
                        Use the area below to manage the current team.
                    </div>
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <h5>{selectedTeam?.name}</h5>
                            <p className="text-muted">{selectedTeam?.description}</p>
                        </div>
                        {isOwner(selectedTeam?.user_role) && (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={onEditClick}
                            >
                                <i className="fas fa-edit me-2"></i>Edit
                            </Button>
                        )}
                    </div>
                </div>

                <hr className="my-4" />

                <h5 className="mt-4"><i className="fas fa-users me-2"></i>Members</h5>
                <ListGroup className="mb-3">
                    {teamUsers
                        .sort((a, b) => {
                            const roleDiff = rolePriority[a.role as keyof typeof rolePriority] -
                                rolePriority[b.role as keyof typeof rolePriority];
                            return roleDiff === 0 ? a.email.localeCompare(b.email) : roleDiff;
                        })
                        .map(teamUser => (
                            <ListGroup.Item
                                key={teamUser.id}
                                className="d-flex justify-content-between align-items-center"
                            >
                                <div>
                                    <div>{teamUser.email}</div>
                                    <Badge
                                        bg={teamUser.role === 'owner' ? 'primary' :
                                            teamUser.role === 'admin' ? 'warning' :
                                                'info'}
                                        text={teamUser.role === 'owner' ? undefined : 'dark'}
                                    >
                                        <i className={`fas fa-${teamUser.role === 'owner' ? 'power-off' :
                                            teamUser.role === 'admin' ? 'lock' :
                                                'user'
                                            } me-1`}></i>
                                        {teamUser.role}
                                    </Badge>
                                </div>
                                <div>
                                    {canManageMembers(selectedTeam?.user_role) &&
                                        teamUser.role !== 'owner' &&
                                        teamUser.user_id !== user?.id && (
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => setEditingMember(teamUser)}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </Button>
                                        )}

                                    {teamUser.user_id === user?.id ? (
                                        teamUser.role !== 'owner' && (
                                            <Button
                                                variant="outline-warning"
                                                size="sm"
                                                onClick={onShowLeaveConfirm}
                                            >
                                                <i className="fas fa-sign-out-alt me-2"></i>
                                                Leave Team
                                            </Button>
                                        )
                                    ) : false}
                                </div>
                            </ListGroup.Item>
                        ))}
                </ListGroup>

                {canManageMembers(selectedTeam?.user_role) && (
                    <div className="d-flex justify-content-end mb-3">
                        <Button
                            variant="primary"
                            onClick={onAddMemberClick}
                            className="mt-0 justify-content-end"
                        >
                            <i className="fas fa-user-plus me-2"></i>
                            Add Member<i className="fas fa-chevron-right ms-2"></i>
                        </Button>
                    </div>
                )}

                <h5 className="mt-4">
                    <i className="fas fa-building me-2"></i>Sites
                </h5>
                <ListGroup className="mb-3">
                    {sites.length === 0 ? (
                        <ListGroup.Item className="text-muted">
                            No locations added yet
                        </ListGroup.Item>
                    ) : (
                        sites.map(site => (
                            <ListGroup.Item
                                key={site.id}
                                className="d-flex justify-content-between align-items-center"
                            >
                                <div>
                                    <div>{site.name}</div>
                                    <small className="text-muted">
                                        {site.city}, {site.state}
                                    </small>
                                </div>
                                <div>
                                    {canManageMembers(selectedTeam?.user_role) && (
                                        <>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => onEditSite(site)}
                                                className=""
                                            >
                                                <i className="fas fa-edit"></i>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </ListGroup.Item>
                        ))
                    )}
                </ListGroup>

                {canManageMembers(selectedTeam?.user_role) && (
                    <div className="d-flex justify-content-end mb-3">
                        <Button
                            variant="primary"
                            onClick={onAddSite}
                            className="mt-0 mb-3 justify-content-end"
                        >
                            <i className="fas fa-plus me-2"></i>
                            Add Site<i className="fas fa-chevron-right ms-2"></i>
                        </Button>
                    </div>
                )}



                {isOwner(selectedTeam?.user_role) && (
                    <>
                        <hr className="my-4 border-danger" />
                        <div className="mt-4">
                            <Button
                                variant="outline-danger"
                                onClick={onDeleteClick}
                            >
                                <i className="fas fa-trash-alt me-2"></i>
                                Delete Team<i className="fas fa-chevron-right ms-2"></i>
                            </Button>
                        </div>
                    </>
                )}

                {/* Add the new edit member component at the bottom of the Offcanvas */}
                {editingMember && (
                    <TeamMemberEdit
                        show={!!editingMember}
                        onHide={() => setEditingMember(null)}
                        teamName={selectedTeam?.name || ''}
                        member={editingMember}
                        onRoleChange={onRoleChange}
                        onRemoveUser={onRemoveUser}
                        currentUserRole={selectedTeam?.user_role}
                    />
                )}
            </Offcanvas.Body>
            <div className="border-top mx-n3 px-3 py-3 mt-auto">
                <div className="d-flex justify-content-end">
                    <Button
                        variant="light"
                        onClick={onHide}
                    >
                        <i className="fas fa-chevron-left me-2"></i>Back
                    </Button>
                </div>
            </div>
        </Offcanvas>
    );
};
