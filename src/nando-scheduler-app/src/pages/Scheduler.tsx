import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import crypto from 'crypto';

// Move static data outside component
const cityResources = {
  'New York': ['Conf Rm 1 (Sm)', 'Conf Rm West (XL)', 'Office 1', 'Office 2'],
  'Los Angeles': ['Conf Rm A', 'Conf Rm B', 'Office A', 'Office B'],
  'Chicago': ['Conf Rm X', 'Conf Rm Y', 'Office X', 'Office Y'],
  'Jays Aviary North': ['Office 1', 'Lounge', 'Cafeteria', 'Patio'],
  'Mariner View South': ['East Office', 'West Lab', 'Conservatory', 'Lounge', 'Cafeteria', 'Patio'],
};

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

const Scheduler: React.FC = () => {
  const localizer = momentLocalizer(moment);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [events, setEvents] = useState([]);

  // Remove cityEvents useMemo since we'll generate on demand
  const generateEventsForResource = (resource: string) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 45); // 45 days in the past
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14); // 2 weeks in the future
    return generateEvents(startDate, endDate, 0.6);
  };

  useEffect(() => {
    // Clear resource and events when city changes
    setSelectedResource('');
    setEvents([]);
  }, [selectedCity]);

  const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(event.target.value);
  };

  const handleResourceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newResource = event.target.value;
    setSelectedResource(newResource);
    // Only generate events when both city and resource are selected
    if (selectedCity && newResource) {
      setEvents(generateEventsForResource(newResource));
    }
  };

  return (
    <>
      <h3>Scheduler</h3>
      <p>
        <label htmlFor="city">Choose a location:&nbsp;</label>
        <select id="city" value={selectedCity} onChange={handleCityChange}>
          <option value="">Select a location...</option>
          {Object.keys(cityResources).map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </p>
      <p>
        <label htmlFor="resource">Choose a resource:&nbsp;</label>
        <select 
          id="resource" 
          value={selectedResource} 
          onChange={handleResourceChange}
          disabled={!selectedCity}
        >
          <option value="">Select a resource...</option>
          {selectedCity && cityResources[selectedCity].map((resource) => (
            <option key={resource} value={resource}>
              {resource}
            </option>
          ))}
        </select>
      </p>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        views={['month', 'week', 'day']}
        style={{ height: 600 }}
      />
    </>
  );
};

export default Scheduler;