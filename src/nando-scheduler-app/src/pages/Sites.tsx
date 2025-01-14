import React, { useState, useEffect } from 'react';
import { Container, Button, Card, Alert } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { Site } from '../types/site';
import { GroupAddSite } from '../components/GroupAddSite';
import { GroupEditSite } from '../components/GroupEditSite';
import { SiteCard } from '../components/SiteCard';
import { SiteDetailsOffcanvas } from '../components/SiteDetailsOffcanvas';

const Sites: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [showSiteDetails, setShowSiteDetails] = useState(false);
  const [showSiteView, setShowSiteView] = useState(false);
  const [showEditSite, setShowEditSite] = useState(false);

  const fetchSites = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Get all sites from groups where the user is a member
      const { data, error } = await supabase
        .from('sites')
        .select(`
          *,
          groups:group_id (
            name,
            group_users!inner (
              role
            )
          )
        `)
        .eq('groups.group_users.user_id', user.id);

      if (error) throw error;
      setSites(data || []);
    } catch (error) {
      console.error('Error fetching sites:', error);
      addToast('Error fetching sites', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSites();
    }
  }, [user]);

  return (
    <>
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3><i className="fas fa-building me-2"></i>Sites</h3>
          {!loading && sites.length > 0 && (
            <Button onClick={() => setShowSiteForm(true)}>
              <i className="fas fa-plus me-2"></i>Add Location
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center">
            <span className="spinner-border" role="status" />
          </div>
        ) : sites.length === 0 ? (
          <Alert variant="light" className="text-center p-5 border">
            <div className="mb-3">
              <i className="fas fa-building fa-3x text-muted"></i>
            </div>
            <h4>No Locations Yet</h4>
            <p className="text-muted mb-4">
              There are no locations available. Locations are added to groups by group owners and admins.
            </p>
          </Alert>
        ) : (
          <div className="row g-4">
            {sites.map(site => (
              <div key={site.id} className="col-md-6 col-lg-4">
                <SiteCard
                  site={site}
                  userRole={site.groups?.group_users[0]?.role}
                  onManage={() => {
                    setSelectedSite(site);
                    setShowSiteView(true); // Always show view first
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </Container>

      <GroupAddSite
        show={showSiteForm}
        onHide={() => setShowSiteForm(false)}
        group={null}
        onSiteAdded={fetchSites}
      />

      <SiteDetailsOffcanvas
        show={showSiteView}
        onHide={() => setShowSiteView(false)}
        site={selectedSite}
        userRole={selectedSite?.groups?.group_users[0]?.role}
        onEdit={() => {
          setShowSiteView(false);
          setShowEditSite(true);
        }}
      />

      <GroupEditSite
        show={showEditSite}
        onHide={() => {
          setShowEditSite(false);
          setShowSiteView(true); // Go back to view mode
        }}
        site={selectedSite}
        onSiteUpdated={() => {
          fetchSites();
          setShowEditSite(false);
          setShowSiteView(true); // Go back to view mode
        }}
        onSiteDeleted={() => {
          fetchSites();
          setSelectedSite(null);
          setShowEditSite(false);
        }}
      />
    </>
  );
};

export default Sites;