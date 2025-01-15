import React, { useState, useEffect } from 'react';
import { Offcanvas, ListGroup, Button, Badge } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';
import { Site } from '../types/site';
import { Resource } from '../types/resource';
import { ResourceAddForm } from './ResourceAddForm';
import { ResourceEditForm } from './ResourceEditForm';
import { ResourceDetailsOffcanvas } from './ResourceDetailsOffcanvas'; // Import the new component

interface Props {
  show: boolean;
  onHide: () => void;
  site: Site | null;
  userRole?: string;
  onEdit: () => void;
}

export const SiteDetailsOffcanvas: React.FC<Props> = ({
  show,
  onHide,
  site,
  userRole,
  onEdit
}) => {
  const { addToast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showEditResource, setShowEditResource] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showResourceDetails, setShowResourceDetails] = useState(false); // New state variable
  const canManage = ['owner', 'admin'].includes(userRole || '');

  const fetchResources = async () => {
    if (!site) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          amenity_count:resource_amenities(count)
        `)
        .eq('site_id', site.id)
        .order('name');

      if (error) throw error;

      // Transform the data to include amenity count
      const resourcesWithCount = data.map(resource => ({
        ...resource,
        amenity_count: resource.amenity_count[0].count
      }));

      setResources(resourcesWithCount);
    } catch (error) {
      console.error('Error fetching resources:', error);
      addToast('Error fetching resources', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchResources();
    }
  }, [site, show]);

  if (!site) return null;

  return (
    <Offcanvas show={show} onHide={onHide} placement="end">
      <Offcanvas.Header closeButton className="border-bottom">
        <div>
          <Offcanvas.Title>
            <i className="fas fa-building me-2"></i>{site.name}
          </Offcanvas.Title>
          <div className="text-muted" style={{ fontSize: '0.85em' }}>
            View site details
          </div>
        </div>
        {canManage && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={onEdit}
          >
            <i className="fas fa-edit me-2"></i>Edit
          </Button>
        )}
      </Offcanvas.Header>
      <Offcanvas.Body>
        <ListGroup variant="flush">
          {/* Existing site details */}
          {site.description && (
            <ListGroup.Item>
              <div className="text-muted mb-1">Description</div>
              {site.description}
            </ListGroup.Item>
          )}
          <ListGroup.Item>
            <div className="text-muted mb-1">Address</div>
            <div>{site.address1}</div>
            {site.address2 && <div>{site.address2}</div>}
            <div>{site.city}, {site.state} {site.postal_code}</div>
          </ListGroup.Item>
          {site.phone && (
            <ListGroup.Item>
              <div className="text-muted mb-1">Contact</div>
              <div>
                <i className="fas fa-phone me-2"></i>
                {site.phone}
              </div>
            </ListGroup.Item>
          )}

          {/* Resources section */}
          <ListGroup.Item>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">
                <i className="fas fa-box me-2"></i>Resources
              </h5>
              {canManage && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowAddResource(true)}
                >
                  <i className="fas fa-plus me-2"></i>Add Resource
                </Button>
              )}
            </div>
            {loading ? (
              <div className="text-center py-3">
                <span className="spinner-border spinner-border-sm" role="status" />
              </div>
            ) : resources.length === 0 ? (
              <div className="text-muted text-center py-3">
                No resources available
              </div>
            ) : (
              <ListGroup variant="flush">
                {resources.map(resource => (
                  <ListGroup.Item
                    key={resource.id}
                    action={true} // Make clickable for all users
                    onClick={() => {
                      setSelectedResource(resource);
                      setShowResourceDetails(true); // New state variable
                    }}
                    className="d-flex justify-content-between align-items-center py-2"
                  >
                    <div>
                      <div><strong>{resource.name}</strong></div>
                      {resource.description && (
                        <small className="text-muted d-block">{resource.description}</small>
                      )}
                      <small className="text-muted d-block">
                        <i className="fas fa-map-marker-alt me-1"></i>
                        {resource.location_description}
                      </small>
                    </div>
                    <div className="d-flex gap-2">
                      <Badge
                        bg="info"
                        text="dark"
                        className="rounded-pill fw-normal"
                        style={{
                          fontSize: '0.65em',
                          padding: '0.35em 0.75em'
                        }}
                      >
                        <i className="fas fa-users me-1"></i>
                        {resource.max_occupants}
                      </Badge>
                      <Badge
                        bg="success"
                        className="rounded-pill fw-normal"
                        style={{
                          fontSize: '0.65em',
                          padding: '0.35em 0.75em'
                        }}
                      >
                        <i className="fas fa-star me-1"></i>
                        {resource.amenity_count}
                      </Badge>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </ListGroup.Item>
        </ListGroup>
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

      <ResourceAddForm
        show={showAddResource}
        onHide={() => setShowAddResource(false)}
        siteId={site.id}
        onResourceAdded={fetchResources}
      />

      {selectedResource && (
        <ResourceEditForm
          show={showEditResource}
          onHide={() => {
            setShowEditResource(false);
            setSelectedResource(null);
          }}
          resource={selectedResource}
          onResourceUpdated={fetchResources}
          onResourceDeleted={() => {
            fetchResources();
            setShowEditResource(false);
            setSelectedResource(null);
          }}
        />
      )}

      <ResourceDetailsOffcanvas
        show={showResourceDetails}
        onHide={() => {
          setShowResourceDetails(false);
          setSelectedResource(null);
        }}
        resource={selectedResource}
        userRole={userRole}
        onResourceUpdated={fetchResources}
        onResourceDeleted={() => {
          fetchResources();
          setShowResourceDetails(false);
          setSelectedResource(null);
        }}
      />
    </Offcanvas>
  );
};