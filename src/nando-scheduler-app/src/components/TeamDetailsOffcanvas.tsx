import React, { useState, useEffect } from 'react';
import { Offcanvas, Form, Button, ListGroup, Badge } from 'react-bootstrap';
import { Team, TeamUser } from '../types/team';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { TeamMemberEdit } from './TeamMemberEdit';
import { Site } from '../types/site';
import { SiteDetailsOffcanvas } from './SiteDetailsOffcanvas';

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
    sites: initialSites, // Rename prop to avoid conflict
    onAddSite,
    onEditSite,
    onRemoveSite
}) => {
    const { user } = useAuth();
    const canManageMembers = (role?: string) => ['owner', 'admin'].includes(role || '');
    const isOwner = (role?: string) => role === 'owner';

    // Add state for member editing
    const [editingMember, setEditingMember] = useState<TeamUser | null>(null);

    // Add new state for site details
    const [showSiteDetails, setShowSiteDetails] = useState(false);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);

    // Add state for sites
    const [sites, setSites] = useState<Site[]>(initialSites);

    // Add refresh trigger state near other states
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch sites when selectedTeam changes
    useEffect(() => {
        if (selectedTeam) {
            fetchSites();
        }
    }, [selectedTeam, refreshTrigger]);

    const fetchSites = async () => {
        // First get sites with resource counts
        const { data: sites, error } = await supabase
            .from('sites')
            .select(`
                *,
                resource_count:resources(count),
                resources!left (id, max_occupants)
            `)
            .eq('team_id', selectedTeam?.id);

        if (error) {
            console.error('Error fetching sites:', error);
            return;
        }

        // Then get aggregated data
        const { data: siteStats, error: statsError } = await supabase
            .from('sites')
            .select(`
                id,
                resource_stats:resources(count)
            `)
            .eq('team_id', selectedTeam?.id);

        if (statsError) {
            console.error('Error fetching site stats:', statsError);
            return;
        }

        // Combine data
        const sitesWithStats = sites?.map(site => {
            const stats = siteStats?.find(s => s.id === site.id);
            return {
                ...site,
                resource_count: site.resources?.length || 0,
                total_capacity: site.resources?.reduce((sum, r) => sum + (r.max_occupants || 0), 0) || 0
            };
        });

        setSites(sitesWithStats || []);
    };

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
                                    <div className="d-flex gap-2">
                                        <Badge
                                            bg={teamUser.role === 'owner' ? 'primary' :
                                                teamUser.role === 'admin' ? 'warning' :
                                                    'info'}
                                            text={teamUser.role === 'owner' ? undefined : 'dark'}
                                            className="rounded-pill fw-normal"
                                            style={{
                                                fontSize: '0.65em',
                                                padding: '0.35em 0.75em'
                                            }}
                                        >
                                            <i className={`fas fa-${teamUser.role === 'owner' ? 'power-off' :
                                                teamUser.role === 'admin' ? 'lock' :
                                                    'user'
                                                } me-1`}></i>
                                            {teamUser.role}
                                        </Badge>
                                        <Badge
                                            bg="secondary"
                                            className="rounded-pill fw-normal"
                                            style={{
                                                fontSize: '0.65em',
                                                padding: '0.35em 0.75em'
                                            }}
                                        >
                                            <i className="fas fa-calendar me-1"></i>
                                            {teamUser.reservation_count || 0} Reservations
                                        </Badge>
                                    </div>
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
                                className="d-flex p-0"
                            >
                                <div
                                    className="d-flex flex-column flex-grow-1 p-3 min-width-0 overflow-hidden"
                                    role="button"
                                    onClick={() => {
                                        setSelectedSite(site);
                                        setShowSiteDetails(true);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="text-truncate w-100">{site.name}</div>
                                    <div 
                                        className="text-muted text-truncate w-100"
                                        style={{ fontSize: '0.85em' }}
                                    >
                                        {site.description}
                                    </div>
                                    <div className="d-flex gap-2 mt-1 flex-wrap">
                                        <Badge
                                            bg="info"
                                            text="dark"
                                            className="rounded-pill fw-normal"
                                            style={{
                                                fontSize: '0.65em',
                                                padding: '0.35em 0.75em'
                                            }}
                                        >
                                            <i className="fas fa-door-open me-1"></i>
                                            {site.resource_count || 0} resources
                                        </Badge>
                                        <Badge
                                            bg="secondary"
                                            className="rounded-pill fw-normal"
                                            style={{
                                                fontSize: '0.65em',
                                                padding: '0.35em 0.75em'
                                            }}
                                        >
                                            <i className="fas fa-users me-1"></i>
                                            {site.total_capacity || 0} capacity
                                        </Badge>
                                    </div>
                                </div>
                                {canManageMembers(selectedTeam?.user_role) && (
                                    <div 
                                        className="d-flex align-items-center" 
                                        style={{ 
                                            minWidth: '60px',
                                            width: '60px',
                                            borderLeft: '1px solid rgb(230, 229, 229)',
                                            padding: '0.5rem'
                                        }}
                                    >
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            className="mx-auto"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditSite(site);
                                            }}
                                        >
                                            <i className="fas fa-edit"></i>
                                        </Button>
                                    </div>
                                )}
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
            {/* Add the SiteDetailsOffcanvas component before the closing Offcanvas tag */}
            <SiteDetailsOffcanvas
                show={showSiteDetails}
                onHide={() => {
                    setShowSiteDetails(false);
                    setSelectedSite(null);
                    setRefreshTrigger(prev => prev + 1); // Trigger refresh
                }}
                site={selectedSite}
                userRole={selectedTeam?.user_role}  // Pass the user's role in this team
                onEdit={() => {
                    setShowSiteDetails(false);
                    if (selectedSite) {
                        onEditSite(selectedSite);
                    }
                    setRefreshTrigger(prev => prev + 1); // Trigger refresh
                }}
            />
        </Offcanvas>
    );
};
