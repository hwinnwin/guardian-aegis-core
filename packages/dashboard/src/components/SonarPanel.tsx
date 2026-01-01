import React from 'react';

const STORAGE_KEY = 'guardian_sonar_missions';

interface MissionData {
  id: string;
  name: string;
  status: string;
  priority: string;
  missingPersons: Array<{
    id: string;
    name: string;
    lastSeenTime: number;
    lastSeenLocation: { latitude: number; longitude: number };
  }>;
  detections: Array<{
    id: string;
    classification: string;
    confidence: string;
    location: { latitude: number; longitude: number };
  }>;
  searchAreas: Array<{
    id: string;
    name: string;
    radiusMeters: number;
    priority: string;
  }>;
  timeline: Array<{
    id: string;
    timestamp: number;
    type: string;
    description: string;
  }>;
  startedAt: number;
}

export function SonarPanel() {
  const [missions, setMissions] = React.useState<MissionData[]>([]);
  const [selectedMission, setSelectedMission] = React.useState<string | null>(null);

  React.useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setMissions(raw ? JSON.parse(raw) : []);
      } catch {
        setMissions([]);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === STORAGE_KEY) {
        sync();
      }
    };

    sync();
    window.addEventListener('storage', onStorage);
    const poll = window.setInterval(sync, 2000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(poll);
    };
  }, []);

  const activeMissions = missions.filter(m => m.status === 'active' || m.status === 'rescue_in_progress');
  const mission = selectedMission ? missions.find(m => m.id === selectedMission) : activeMissions[0];

  if (missions.length === 0) {
    return (
      <div style={{ border: '1px solid #0ea5e9', borderRadius: 8, padding: 16, background: '#f0f9ff' }}>
        <h3 style={{ margin: '0 0 12px', color: '#0369a1' }}>Sonar Search & Rescue</h3>
        <p style={{ color: '#64748b', margin: 0 }}>No active search missions. System ready.</p>
        <div style={{ marginTop: 12, padding: 12, background: '#e0f2fe', borderRadius: 6 }}>
          <strong>Quick Start:</strong>
          <pre style={{ margin: '8px 0 0', fontSize: 12, overflow: 'auto' }}>
{`import { createSonarSearchSystem } from '@guardian/sonar';

const system = createSonarSearchSystem({ region: 'gold_coast' });
system.reportMissingPerson('John Doe', {
  latitude: -28.0027,
  longitude: 153.4310
});`}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #0ea5e9', borderRadius: 8, padding: 16, background: '#f0f9ff' }}>
      <h3 style={{ margin: '0 0 12px', color: '#0369a1' }}>
        Sonar Search & Rescue
        <span style={{
          marginLeft: 8,
          fontSize: 12,
          padding: '2px 8px',
          borderRadius: 12,
          background: activeMissions.length > 0 ? '#dc2626' : '#22c55e',
          color: 'white'
        }}>
          {activeMissions.length} Active
        </span>
      </h3>

      {/* Mission Selector */}
      {missions.length > 1 && (
        <select
          value={selectedMission ?? ''}
          onChange={e => setSelectedMission(e.target.value || null)}
          style={{ marginBottom: 12, padding: 6, borderRadius: 4, width: '100%' }}
        >
          <option value="">Latest Active Mission</option>
          {missions.map(m => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.status})
            </option>
          ))}
        </select>
      )}

      {mission && (
        <>
          {/* Mission Status */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: 8,
            marginBottom: 16
          }}>
            <StatusCard label="Status" value={mission.status} highlight={mission.status === 'rescue_in_progress'} />
            <StatusCard label="Priority" value={mission.priority} highlight={mission.priority === 'critical'} />
            <StatusCard label="Missing" value={mission.missingPersons.length} />
            <StatusCard label="Detections" value={mission.detections.length} />
            <StatusCard label="Search Areas" value={mission.searchAreas.length} />
          </div>

          {/* Missing Persons */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#334155' }}>Missing Persons</h4>
            {mission.missingPersons.map(person => (
              <div key={person.id} style={{
                padding: 10,
                background: '#fee2e2',
                borderRadius: 6,
                marginBottom: 6,
                borderLeft: '4px solid #dc2626'
              }}>
                <strong>{person.name}</strong>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Last seen: {formatTimeAgo(person.lastSeenTime)} at{' '}
                  {person.lastSeenLocation.latitude.toFixed(4)}, {person.lastSeenLocation.longitude.toFixed(4)}
                </div>
              </div>
            ))}
          </div>

          {/* Human Detections */}
          {mission.detections.filter(d => d.classification.includes('human')).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#334155' }}>
                Human Detections
              </h4>
              {mission.detections
                .filter(d => d.classification.includes('human'))
                .map(detection => (
                  <div key={detection.id} style={{
                    padding: 10,
                    background: detection.confidence === 'confirmed' ? '#bbf7d0' : '#fef9c3',
                    borderRadius: 6,
                    marginBottom: 6,
                    borderLeft: `4px solid ${detection.confidence === 'confirmed' ? '#22c55e' : '#eab308'}`
                  }}>
                    <strong>{detection.classification.replace(/_/g, ' ')}</strong>
                    <span style={{
                      marginLeft: 8,
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: getConfidenceColor(detection.confidence),
                      color: 'white'
                    }}>
                      {detection.confidence}
                    </span>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                      Location: {detection.location.latitude.toFixed(4)}, {detection.location.longitude.toFixed(4)}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Search Areas */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#334155' }}>Search Areas</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 6 }}>
              {mission.searchAreas.map(area => (
                <div key={area.id} style={{
                  padding: 8,
                  background: '#e0f2fe',
                  borderRadius: 6,
                  fontSize: 12
                }}>
                  <div style={{ fontWeight: 600 }}>{area.name}</div>
                  <div style={{ color: '#64748b' }}>
                    {area.radiusMeters}m radius • {area.priority}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#334155' }}>
              Timeline (Last 10 Events)
            </h4>
            <div style={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
              {mission.timeline.slice(-10).reverse().map(event => (
                <div key={event.id} style={{
                  padding: '6px 0',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  gap: 8
                }}>
                  <span style={{ color: '#94a3b8', minWidth: 70 }}>
                    {formatTime(event.timestamp)}
                  </span>
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: getEventColor(event.type),
                    color: 'white',
                    fontSize: 10
                  }}>
                    {event.type.replace(/_/g, ' ')}
                  </span>
                  <span style={{ color: '#475569' }}>{event.description}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <small style={{ display: 'block', opacity: 0.7, marginTop: 12, textAlign: 'right' }}>
        Updated: {new Date().toLocaleTimeString()}
      </small>
    </div>
  );
}

function StatusCard({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div style={{
      padding: 8,
      background: highlight ? '#dc2626' : '#ffffff',
      color: highlight ? '#ffffff' : '#334155',
      borderRadius: 6,
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 11, opacity: 0.8 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{String(value)}</div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getConfidenceColor(confidence: string): string {
  switch (confidence) {
    case 'confirmed': return '#22c55e';
    case 'high': return '#3b82f6';
    case 'medium': return '#eab308';
    default: return '#94a3b8';
  }
}

function getEventColor(type: string): string {
  if (type.includes('person_located') || type.includes('person_recovered')) return '#22c55e';
  if (type.includes('rescue')) return '#3b82f6';
  if (type.includes('detection')) return '#eab308';
  if (type.includes('critical') || type.includes('urgent')) return '#dc2626';
  return '#64748b';
}
