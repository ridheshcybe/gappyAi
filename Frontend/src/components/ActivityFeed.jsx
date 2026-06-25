// frontend/components/ActivityFeed.jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getActivityFeed, getIncidentActivity } from '../lib/api';

// Initialize socket connection
const socket = io(window.location.origin);

export default function ActivityFeed({ incidentId }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      try {
        const response = incidentId
          ? await getIncidentActivity(incidentId)
          : await getActivityFeed(30);
        setEvents(response.events || []);
      } catch (error) {
        console.error('Failed to fetch activity:', error);
      }
    };

    fetchData();

    // Set up socket listeners
    const handleActivity = (activity) => {
      if (!incidentId || activity.incidentId === incidentId) {
        setEvents(prev => [activity, ...prev].slice(0, 100)); // Keep last 100
      }
    };

    const handleFeedUpdate = (activity) => {
      if (!incidentId) {
        setEvents(prev => [activity, ...prev].slice(0, 100));
      }
    };

    const eventName = incidentId ? 'activity' : 'feed:update';
    const handler = incidentId ? handleActivity : handleFeedUpdate;
    socket.on(eventName, handler);

    // Join appropriate room
    if (incidentId) {
      socket.emit('subscribe:incident', incidentId);
    } else {
      socket.emit('subscribe:feed');
    }

    // Cleanup
    return () => {
      socket.off(eventName, handler);
    };
  }, [incidentId]);

  return (
    <div className="activity-feed">
      <h3>Activity</h3>
      {events.length === 0 ? (
        <p className="empty">No activity yet</p>
      ) : (
        <div className="activity-list">
          {events.map(e => (
            <div key={e.id} className="activity-item">
              <div className="activity-ts">{new Date(e.ts).toLocaleTimeString()}</div>
              <div className="activity-type">{e.type.replace('_', ' ')}</div>
              <div className="activity-actor">{e.actor}</div>
              {e.payload && e.payload.detail && (
                <div className="activity-detail">{e.payload.detail}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
