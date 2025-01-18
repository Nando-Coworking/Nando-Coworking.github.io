import React, { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import crypto from 'crypto';
import { Form } from 'react-bootstrap';
import '../styles/react-big-calendar.css';  // Update this import path
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Add this import
import { ResourceDetailsOffcanvas } from '../components/ResourceDetailsOffcanvas'; // Add this import
import { ReservationDetailsOffcanvas } from '../components/ReservationDetailsOffcanvas'; // Add this import
import { useAuth } from '../AuthContext';
import { ReservationCreateForm } from '../components/ReservationCreateForm';
import { useToast } from '../ToastContext';

interface Site {
  id: string;
  name: string;
  resources: Resource[];
}

interface Resource {
  id: string;
  name: string;
  site_id: string;
}

interface Reservation {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  resource_id: string;
  user_id: string;
}

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const getSecureRandom = (): number => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / 0xFFFFFFFF;
};

const generateEvents = (startDate: Date, endDate: Date) => {
  const events = [];
  const today = new Date();
  const currentWeek = Math.floor((today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

  // Add duration configuration
  const durations = [2, 4, 8]; // hours
  const weights = [0.5, 0.3, 0.2]; // 50% 2hr, 30% 4hr, 20% 8hr

  const getRandomDuration = () => {
    const rand = getSecureRandom();
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (rand < sum) return durations[i];
    }
    return durations[0];
  };

  const pastWeeks = 6;
  const futureWeeks = 2;
  const totalWeeks = pastWeeks + 1 + futureWeeks;

  for (let week = 0; week < totalWeeks; week++) {
    let targetUtilization;
    if (week < pastWeeks || week === pastWeeks) {
      targetUtilization = 0.6;
    } else {
      targetUtilization = 0.2;
    }

    const hoursPerDay = 9;
    const availableHoursPerWeek = hoursPerDay * 5;
    const targetHoursPerWeek = availableHoursPerWeek * targetUtilization;

    // Track bookings per day
    const dayBookings = new Map([
      [1, 0], // Monday
      [2, 0], // Tuesday
      [3, 0], // Wednesday
      [4, 0], // Thursday
      [5, 0]  // Friday
    ]);

    let weeklyHoursBooked = 0;
    let attempts = 0;

    while (weeklyHoursBooked < targetHoursPerWeek && attempts < 100) {
      attempts++;

      // Find least booked days
      const minBookings = Math.min(...Array.from(dayBookings.values()));
      const availableDays = Array.from(dayBookings.entries())
        .filter(([_, hours]) => hours === minBookings)
        .map(([day]) => day);

      // Randomly select from least booked days
      const dayIndex = Math.floor(getSecureRandom() * availableDays.length);
      const dayOfWeek = availableDays[dayIndex];

      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + (week * 7) + dayOfWeek);

      if (isWeekend(currentDate) || (isToday(currentDate) && isWeekend(today))) {
        continue;
      }

      const duration = getRandomDuration();
      const maxStartHour = 17 - duration;

      if (maxStartHour <= 8) continue;

      const startHour = 8 + Math.floor(getSecureRandom() * (maxStartHour - 8));

      const hasOverlap = events.some(event => {
        if (event.start.getDate() !== currentDate.getDate()) return false;
        const eventStartHour = event.start.getHours();
        const eventEndHour = event.end.getHours();
        return !(startHour >= eventEndHour || (startHour + duration) <= eventStartHour);
      });

      if (!hasOverlap && (weeklyHoursBooked + duration <= targetHoursPerWeek)) {
        events.push({
          title: 'Reserved',
          start: new Date(currentDate.setHours(startHour, 0, 0, 0)),
          end: new Date(new Date(currentDate).setHours(startHour + duration, 0, 0, 0))
        });
        weeklyHoursBooked += duration;
        dayBookings.set(dayOfWeek, dayBookings.get(dayOfWeek)! + duration);
      }
    }
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
};

// Add custom Event component near top of file
const EventComponent = ({ event }: any) => (
  <div>
    <div className="rbc-event-title">{event.title}</div>
    {event.resources?.sites && (
      <small className="rbc-event-subtitle text-muted">
        {`${event.resources.sites.name} - ${event.resources.name}`}
      </small>
    )}
  </div>
);

const Scheduler: React.FC = () => {
  const { city, resource } = useParams();
  const navigate = useNavigate();
  const localizer = momentLocalizer(moment);
  const initialLoadRef = useRef(true);
  const { user } = useAuth();
  const { addToast } = useToast();  // Add this line near other hooks
  const [sites, setSites] = useState<Site[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [events, setEvents] = useState([]);
  const [showResourceDetails, setShowResourceDetails] = useState(false); // Add this state
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null); // Add this state
  const [showReservationDetails, setShowReservationDetails] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]); // New state for all reservations
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  // Fetch sites
  useEffect(() => {
    const fetchSites = async () => {
      const { data, error } = await supabase
        .from('sites')
        .select(`
          id,
          name,
          team_id,
          resources (
            id,
            name
          )
        `)
        .order('name');

      if (error) {
        console.error('Error fetching sites:', error);
        return;
      }
      setSites(data || []);
    };

    fetchSites();
  }, []);

  // Define fetchAllReservations as a reusable function
  const fetchAllReservations = async () => {
    if (!user?.id || !user?.email) return;

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          resources:resource_id (
            *,
            sites:site_id (
              *,
              teams:team_id (*)
            )
          )
        `)
        .or(`user_id.eq.${user?.id},participants.cs.{"${user?.email}"}`);

      if (error) {
        console.error('Error fetching reservations:', error);
        return;
      }

      setAllReservations(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Update initial load effect to use the function
  useEffect(() => {
    fetchAllReservations();
  }, [user]);

  // Filter reservations based on selected site and resource
  useEffect(() => {
    const filteredReservations = allReservations.filter(reservation => {
      // Ensure reservation has required nested data
      if (!reservation.resources?.sites) return false;

      if (!selectedSiteId && !selectedResourceId) return true;
      if (selectedSiteId && !selectedResourceId) {
        return reservation.resources.sites.id === selectedSiteId;
      }
      if (selectedResourceId) {
        return reservation.resource_id === selectedResourceId;
      }
      return true;
    });

    const events = filteredReservations.map(reservation => ({
      id: reservation.id,
      title: reservation.title,
      start: new Date(reservation.start_time),
      end: new Date(reservation.end_time),
      resource_id: reservation.resource_id,
      resources: reservation.resources
    }));

    setEvents(events);
  }, [selectedSiteId, selectedResourceId, allReservations]);

  // Update site selection
  const handleSiteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const siteId = event.target.value;
    setSelectedSiteId(siteId);
    setSelectedResourceId('');
    setEvents([]);

    if (siteId) {
      const site = sites.find(s => s.id === siteId);
      navigate(`/scheduler/${encodeURIComponent(site?.name || '')}`);
    } else {
      navigate('/scheduler');
    }
  };

  // Update resource selection
  const handleResourceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const resourceId = event.target.value;
    setSelectedResourceId(resourceId);

    if (resourceId && selectedSiteId) {
      const site = sites.find(s => s.id === selectedSiteId);
      const resource = resources.find(r => r.id === resourceId);
      navigate(`/scheduler/${encodeURIComponent(site?.name || '')}/${encodeURIComponent(resource?.name || '')}`);
    }
  };

  // Add this new function to handle event clicks
  // Update handleEventClick to use the same query structure that works in fetchReservations
  const handleEventClick = async (event: any) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
        *,
        resources:resource_id (
          *,
          sites:site_id (
            *,
            teams:team_id (*)
          )
        )
      `)
        .eq('id', event.id)
        .or(`user_id.eq.${user?.id},participants.cs.{"${user?.email}"}`)
        .single();

      if (error) throw error;
      setSelectedReservation(data);
      setShowReservationDetails(true);
    } catch (error) {
      console.error('Error fetching reservation:', error);
    }
  };

  // Add handler for slot selection
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (!selectedSiteId || !selectedResourceId) {
      addToast('Please select a location and resource first', 'warning');
      return;
    }

    setSelectedSlot({ start, end });
    setShowCreateForm(true);
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3><i className="fas fa-calendar-days me-2"></i>Scheduler</h3>

        <Form className="d-flex align-items-center gap-3">
          <Form.Group className="mb-0">
            <div className="d-flex align-items-center">
              <Form.Label htmlFor="site" className="me-2 mb-0">Location:</Form.Label>
              <Form.Select
                id="site"
                value={selectedSiteId}
                onChange={handleSiteChange}
                className="form-select-sm"
                style={{ width: '200px' }}
              >
                <option value="">All Locations</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </Form.Select>
            </div>
          </Form.Group>

          <Form.Group className="mb-0">
            <div className="d-flex align-items-center">
              <Form.Label htmlFor="resource" className="me-2 mb-0">Resource:</Form.Label>
              <Form.Select
                id="resource"
                value={selectedResourceId}
                onChange={handleResourceChange}
                disabled={!selectedSiteId}
                className="form-select-sm"
                style={{ width: '200px' }}
              >
                <option value="">All Resources</option>
                {selectedSiteId && sites
                  .find(s => s.id === selectedSiteId)
                  ?.resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                    </option>
                  ))}
              </Form.Select>
            </div>
          </Form.Group>
        </Form>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        views={['month', 'week', 'day']}
        style={{ height: 600 }}
        onSelectEvent={handleEventClick}  // Add this line
        selectable={true}
        onSelectSlot={handleSelectSlot}
        components={{
          event: EventComponent
        }}
      />

      {/* Add this at the bottom */}
      <ResourceDetailsOffcanvas
        show={showResourceDetails}
        onHide={() => {
          setShowResourceDetails(false);
          setSelectedResource(null);
        }}
        resource={selectedResource}
        userRole="member"  // Force member view for read-only access
        onResourceUpdated={() => { }} // No-op since we're in read-only mode
        onResourceDeleted={() => { }} // No-op since we're in read-only mode
      />

      <ReservationDetailsOffcanvas
        show={showReservationDetails}
        onHide={() => {
          setShowReservationDetails(false);
          setSelectedReservation(null);
        }}
        reservation={selectedReservation}
        onReservationUpdated={fetchAllReservations}
        onReservationDeleted={fetchAllReservations}
        onResourceClick={(resource) => {
          setSelectedResource(resource);
          setShowResourceDetails(true);
        }}
        onSiteClick={() => { }} // No-op since we don't show site details in scheduler
      />

      <ReservationCreateForm
        show={showCreateForm}
        onHide={() => {
          setShowCreateForm(false);
          setSelectedSlot(null);
        }}
        onReservationCreated={() => {
          fetchAllReservations();
          setShowCreateForm(false);
          setSelectedSlot(null);
        }}
        initialValues={{
          team_id: sites.find(s => s.id === selectedSiteId)?.team_id, // Use team_id directly from site
          site_id: selectedSiteId,
          resource_id: selectedResourceId,
          start_time: selectedSlot ? moment(selectedSlot.start).format('YYYY-MM-DDTHH:mm') : undefined,
          end_time: selectedSlot ? moment(selectedSlot.end).format('YYYY-MM-DDTHH:mm') : undefined
        }}
      />
    </>
  );
};

export default Scheduler;