import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.heat';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import * as L from 'leaflet';
import { Filter } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { listCases } from '../services/caseService';

// Crime type mapping: UI display label -> database canonical value
const CRIME_TYPE_MAP: Record<string, string> = {
  'Theft': 'theft',
  'Burglary': 'burglary',
  'Assault': 'assault',
  'Robbery': 'robbery',
  'Homicide': 'murder',  // Database uses "murder" not "homicide"
  'Fraud': 'fraud',
  'Cyber Crime': 'cybercrime',
  'Narcotics': 'narcotics',
  'Domestic Violence': 'domestic violence',
  'Traffic Violation': 'traffic violation',
};

const CRIME_TYPES = Object.keys(CRIME_TYPE_MAP);

const DISTRICTS_LIST = [
  'Bangalore Urban',
  'Bangalore Rural',
  'Belgaum',
  'Dharwad',
  'Gulbarga',
  'Hubli',
  'Mangalore',
  'Mysore',
  'Shimoga',
  'Tumkur',
];

interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
  case_id: string;
  crime_type: string;
  status: string;
  location: string;
  district: string;
  date_filed: string;
}

interface HotspotInfo {
  district: string;
  location: string;
  caseCount: number;
  crimeTypeBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  center: [number, number];
}

interface HeatMapAPIPoint {
  case_id: string;
  latitude: number;
  longitude: number;
  crime_type: string;
  status: string;
  date_filed: string;
  district: string;
  intensity?: number;
  location?: string;
}

function HeatmapLayer({ points, radius = 20, blur = 20, maxZoom = 14 }: { 
  points: { lat: number; lng: number; intensity: number }[];
  radius?: number;
  blur?: number;
  maxZoom?: number;
}) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    if (points.length === 0) return;

    const heatData: [number, number, number][] = points.map((p) => [
      p.lat,
      p.lng,
      p.intensity,
    ]);

    heatLayerRef.current = L.heatLayer(heatData, {
      radius,
      blur,
      maxZoom,
      max: 1.0,
      minOpacity: 0.4,
      gradient: {
        0.05: '#0d47a1',
        0.15: '#1565c0',
        0.25: '#1976d2',
        0.40: '#1e88e5',
        0.50: '#00acc1',
        0.60: '#00bfa5',
        0.70: '#43a047',
        0.75: '#8bc34a',
        0.80: '#ffeb3b',
        0.85: '#ffb300',
        0.90: '#ff8f00',
        0.95: '#ff5722',
        1.00: '#d32f2f',
      },
    });

    heatLayerRef.current.addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points, radius, blur, maxZoom]);

  return null;
}

export default function HeatMapPage() {
  const [heatPoints, setHeatPoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCrimeTypes, setSelectedCrimeTypes] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [applyingFilters, setApplyingFilters] = useState(false);
  const mapRef = useRef<any>(null);
  const [hotspotInfo, setHotspotInfo] = useState<HotspotInfo | null>(null);
  const [showHotspotInfo, setShowHotspotInfo] = useState(false);

  const fetchHeatMapData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setApplyingFilters(true);
    try {
      // Get auth token from localStorage (where auth store persists it)
      const token = localStorage.getItem('crimeintel_token');
      
      // Build query parameters for filters
      const params = new URLSearchParams();
      if (selectedCrimeTypes.length === 1) {
        // Map UI crime type to database canonical value
        const dbCrimeType = CRIME_TYPE_MAP[selectedCrimeTypes[0]];
        if (dbCrimeType) {
          params.append('crime_type', dbCrimeType);
        }
      }
      if (selectedDistrict) {
        params.append('district', selectedDistrict);
      }
      if (dateFrom) {
        params.append('from', dateFrom);
      }
      if (dateTo) {
        params.append('to', dateTo);
      }
      
      const queryString = params.toString();
      const url = `/api/v1/analytics/heatmap/data${queryString ? '?' + queryString : ''}`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      const data: HeatMapAPIPoint[] = await res.json();

      if (!res.ok) {
        throw new Error(
          (data as any)?.detail || 'Failed to load heatmap data',
        );
      }

      // Convert API points to HeatPoint format, filtering out invalid coordinates
      const points: HeatPoint[] = data
        .filter((p) => {
          const lat = Number(p.latitude);
          const lng = Number(p.longitude);
          return Number.isFinite(lat) && Number.isFinite(lng) &&
                 lat >= -90 && lat <= 90 &&
                 lng >= -180 && lng <= 180;
        })
        .map((p) => ({
          lat: Number(p.latitude),
          lng: Number(p.longitude),
          intensity: p.intensity ?? 1.0,
          case_id: p.case_id,
          crime_type: p.crime_type,
          status: p.status,
          location: p.location || p.district || 'Bangalore',
          district: p.district || 'Bangalore',
          date_filed: p.date_filed,
        }));

      console.log(`[HEATMAP] received: ${data.length}, valid: ${points.length}`);
      if (points.length === 0) {
        // Distinguish between no records and no valid coordinates
        const hasFilters = selectedCrimeTypes.length > 0 || selectedDistrict || dateFrom || dateTo;
        if (hasFilters) {
          throw new Error('No crime cases match the selected filters.');
        } else {
          throw new Error('No valid coordinate data available');
        }
      }

      setHeatPoints(points);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to load heatmap data',
      );
      // Fallback to listCases if heatmap API fails
      try {
        const res = await listCases({ limit: 500 });
        const points: HeatPoint[] = (res.data || []).map((c: any) => ({
          lat: c.latitude ?? 0,
          lng: c.longitude ?? 0,
          intensity: 0.3 + Math.random() * 0.7,
          case_id: c.case_id,
          crime_type: c.crime_type,
          status: c.status,
          location: c.location || '',
          district: c.district || 'Bangalore',
          date_filed: c.date_filed,
        }));
        setHeatPoints(points);
      } catch {}
    } finally {
      setLoading(false);
      setApplyingFilters(false);
    }
  }, [selectedCrimeTypes, selectedDistrict, dateFrom, dateTo]);

  useEffect(() => {
    fetchHeatMapData();
  }, [fetchHeatMapData]);

  // Auto-fit map bounds when heatPoints change
  useEffect(() => {
    if (mapRef.current && heatPoints.length > 0) {
      const validPoints = heatPoints.filter(p => 
        Number.isFinite(p.lat) && Number.isFinite(p.lng)
      );
      
      if (validPoints.length > 0) {
        const bounds = validPoints.map(p => [p.lat, p.lng] as [number, number]);
        // @ts-ignore
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    }
  }, [heatPoints]);

  const toggleCrimeType = (type: string) => {
    setSelectedCrimeTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type],
    );
  };

  // Compute hotspot info for a cluster of points
  const computeHotspotInfo = (points: HeatPoint[]): HotspotInfo => {
    const crimeTypeBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};
    let latSum = 0;
    let lngSum = 0;

    points.forEach((p) => {
      crimeTypeBreakdown[p.crime_type] = (crimeTypeBreakdown[p.crime_type] || 0) + 1;
      statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
      latSum += p.lat;
      lngSum += p.lng;
    });

    // Find most common location
    const locationCounts: Record<string, number> = {};
    points.forEach((p) => {
      locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
    });
    const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    return {
      district: points[0]?.district || 'Unknown',
      location: topLocation,
      caseCount: points.length,
      crimeTypeBreakdown,
      statusBreakdown,
      center: [latSum / points.length, lngSum / points.length] as [number, number],
    };
  };

  const handleClusterClick = (points: HeatPoint[]) => {
    const info = computeHotspotInfo(points);
    setHotspotInfo(info);
    setShowHotspotInfo(true);
    
    // Center map on hotspot
    if (mapRef.current) {
      mapRef.current.setView(info.center, 13);
    }
  };

// Marker click handler - can be enabled if needed
  // const handleMarkerClick = (point: HeatPoint) => {
  //   const info = computeHotspotInfo([point]);
  //   setHotspotInfo(info);
  //   setShowHotspotInfo(true);
  // };

  // Filter heat points by crime type and district (for markers)
  const filteredPoints = heatPoints.filter((p) => {
    const matchesCrimeType = selectedCrimeTypes.length === 0 || selectedCrimeTypes.includes(p.crime_type);
    const matchesDistrict = !selectedDistrict || p.district === selectedDistrict;
    return matchesCrimeType && matchesDistrict;
  });

  // Prepare heatmap data points
  const heatmapPoints = heatPoints
    .filter((p) => {
      const matchesCrimeType = selectedCrimeTypes.length === 0 || selectedCrimeTypes.includes(p.crime_type);
      const matchesDistrict = !selectedDistrict || p.district === selectedDistrict;
      return matchesCrimeType && matchesDistrict;
    })
    .map((p) => ({
      lat: p.lat,
      lng: p.lng,
      intensity: p.intensity,
    }));

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 shadow-sm relative">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="lg" text="Loading map data..." />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center">
            <p className="mb-4 text-red-600">{error}</p>
            <Button onClick={fetchHeatMapData}>Retry</Button>
          </div>
        ) : heatPoints.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={<Filter size={48} />}
              title="No crime cases match the selected filters."
              description="Try adjusting the filters to see more data."
            />
          </div>
        ) : (
          <MapContainer
            ref={mapRef}
            center={[12.9716, 77.5946]}
            zoom={12}
            className="h-full w-full"
            zoomControl={true}
            whenReady={() => { mapRef.current = mapRef.current; }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Heatmap layer */}
            <HeatmapLayer points={heatmapPoints} />
            
            {/* Marker clustering layer */}
<MarkerClusterGroup
              chunkedLoading
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
              zoomToBoundsOnClick
              onClusterClick={() => {
                handleClusterClick(filteredPoints);
              }}
            >
              {filteredPoints.map((point) => (
                <Marker
                  key={point.case_id}
                  position={[point.lat, point.lng]}
                >
                  <Popup>
                    <div className="min-w-[220px]">
                      <div className="font-semibold text-gray-900 mb-1">{point.case_id}</div>
                      <div className="text-sm text-gray-600 mb-1">{point.location}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-medium">{point.crime_type}</span>
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">{point.status}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Filed: {point.date_filed ? new Date(point.date_filed).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => window.location.href = `/cases/${point.case_id}`}
                        >
                          View Case
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
            {/* Hotspot info panel */}
            {showHotspotInfo && hotspotInfo && (
              <div className="absolute top-4 right-4 z-[1000] w-72 rounded-lg border border-gray-200 bg-white shadow-lg p-4 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Crime Hotspot</h3>
                  <button
                    onClick={() => setShowHotspotInfo(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    aria-label="Close hotspot info"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{hotspotInfo.location}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-medium">{hotspotInfo.district}</span>
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">{hotspotInfo.district}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">Cases: <span className="font-semibold">{hotspotInfo.caseCount}</span></p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">Crime Types</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(hotspotInfo.crimeTypeBreakdown).map(([type, count]) => (
                        <span key={type} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(hotspotInfo.statusBreakdown).map(([status, count]) => (
                        <span key={status} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                          {status}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowHotspotInfo(false)}
                    >
                      Close
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => window.location.href = `/cases?district=${encodeURIComponent(hotspotInfo.district)}&crime_type=${Object.keys(hotspotInfo.crimeTypeBreakdown)[0] || ''}`}
                    >
                      View Cases
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </MapContainer>
        )}

        <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex h-3 w-3 rounded-full bg-blue-500" />
            <span>Low</span>
            <span className="flex h-3 w-3 rounded-full bg-cyan-500" />
            <span>Medium</span>
            <span className="flex h-3 w-3 rounded-full bg-yellow-500" />
            <span>High</span>
            <span className="flex h-3 w-3 rounded-full bg-orange-500" />
            <span>Very High</span>
          </div>
        </div>
      </div>

      <div className="w-72 space-y-4">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Filters</h3>

          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-gray-500">
              Crime Type
            </p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {CRIME_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedCrimeTypes.includes(type)}
                    onChange={() => toggleCrimeType(type)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="mb-1 text-xs font-medium text-gray-500">
              District
            </p>
            <select
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value as string)}
            >
              <option value="">All Districts</option>
              {DISTRICTS_LIST.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <p className="mb-1 text-xs font-medium text-gray-500">
              Date Range
            </p>
            <div className="space-y-2">
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From"
              />
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To"
              />
            </div>
          </div>

          <Button 
            size="sm" 
            className="w-full" 
            onClick={fetchHeatMapData}
            disabled={applyingFilters}
          >
            {applyingFilters ? 'Applying...' : 'Apply Filters'}
          </Button>
        </Card>

        <Card>
          <p className="text-xs font-medium text-gray-500">
            Total Incidents
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {heatPoints.length}
          </p>
        </Card>
      </div>
    </div>
  );
}