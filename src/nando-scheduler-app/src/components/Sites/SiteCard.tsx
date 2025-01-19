import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Site } from '../../types/site';

interface Props {
    site: Site;
    onManage: (site: Site) => void;
    userRole?: string;
}

export const SiteCard: React.FC<Props> = ({ site, onManage, userRole }) => {
    const canManage = ['owner', 'admin'].includes(userRole || '');

    return (
        <Card className="h-100">
            <Card.Body className="d-flex flex-column">
                <Card.Title className="d-flex justify-content-between">
                    {site.name}
                    <Badge
                        bg={'primary'}
                        className="fw-normal"
                        style={{ fontSize: '0.65em' }}
                    >
                        <i className={`fas fa-users me-1`}></i>
                        {site.teams?.name || 'Unknown Team'}
                    </Badge>
                </Card.Title>
                <Card.Text className="text-truncate-2">{site.description}</Card.Text>
                <div className="mt-2 mb-3 d-flex gap-2">
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
                        {site.resources?.length || 0} resources
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
                        {site.resources?.reduce((sum, r) => sum + (r.max_occupants || 0), 0) || 0} capacity
                    </Badge>
                </div>
                <div className="mt-auto">
                    <small className="text-muted d-block">
                        <i className="fas fa-map-marker-alt me-1"></i>
                        {site.city}, {site.state}
                    </small>
                    {site.phone && (
                        <small className="text-muted d-block">
                            <i className="fas fa-phone me-1"></i>
                            {site.phone}
                        </small>
                    )}
                </div>
            </Card.Body>
            <Card.Footer className="d-flex justify-content-end">
                <Button
                    variant={canManage ? "outline-primary" : "outline-secondary"}
                    onClick={() => onManage(site)}
                >
                    {canManage ? (
                        <>
                            <i className="fas fa-cog me-2"></i>Manage
                        </>
                    ) : (
                        <>
                            <i className="fas fa-eye me-2"></i>View
                        </>
                    )}
                    <i className="fas fa-chevron-right ms-2"></i>
                </Button>
            </Card.Footer>
        </Card>
    );
};