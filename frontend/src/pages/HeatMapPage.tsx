import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { listCases } from '../services/caseService';
import type { Case } from '../types/case';

const CRIME_TYPES = [
  'Theft',
  'Burglary',
  'Assault',
  'Robbery',
  'Homicide',
  'Fraud',
  'Cyber Crime',
  'Narcotics',
  'Domestic Violence',
  'Traffic Violation',
];

const DISTRICTS = ['North', 'South', 'East', 'West', 'Central'];

interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
}

function HeatmapLayer({ points }: { points: HeatPoint[] }) {
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

    heatLayerRef.current = (L as any).heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      max: 1.0,
      gradient: {
        0.0: 'blue',
        0.25: 'cyan',
        0.5: 'yellow',
        0.75: 'orange',
        1.0: 'red',
      },
    });

    heatLayerRef.current.addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points]);

  return null;
}

function generateMockPoints(cases: Case[]): HeatPoint[] {
  const baseCoords: Record<string, [number, number]> = {
    North: [12.9716, 77.5946],
    South: [12.9344, 77.6101],
    East: [12.9611, 77.6412],
    West: [12.9767, 77.5713],
    Central: [12.9763, 77.6033],
  };

  return cases
    .filter((c) => c.location)
    .map((c) => {
      const base = baseCoords[c.district] ?? baseCoords.Central;
      const lat = base[0] + (Math.random() - 0.5) * 0.02;
      const lng = base[1] + (Math.random() - 0.5) * 0.02;
      return {
        lat,
        lng,
        intensity: 0.3 + Math.random() * 0.7,
      };
    });
}

export default function HeatMapPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCrimeTypes, setSelectedCrimeTypes] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { limit: 500 };
      if (selectedDistrict) params.district = selectedDistrict;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (selectedCrimeTypes.length > 0)
        params.crime_type = selectedCrimeTypes[0];

      const res = await listCases(params);
      setCases(res.data);
    } catch {
      setError('Failed to load incident data');
    } finally {
      setLoading(false);
    }
  }, [selectedDistrict, dateFrom, dateTo, selectedCrimeTypes]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const toggleCrimeType = (type: string) => {
    setSelectedCrimeTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type],
    );
  };

  const filteredCases =
    selectedCrimeTypes.length > 0
      ? cases.filter((c) => selectedCrimeTypes.includes(c.crime_type))
      : cases;

  const filteredPoints = generateMockPoints(filteredCases);

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="lg" text="Loading map data..." />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center">
            <p className="mb-4 text-red-600">{error}</p>
            <Button onClick={fetchCases}>Retry</Button>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={<Filter size={48} />}
              title="No incidents match your filter"
              description="Try adjusting the filters to see more data."
            />
          </div>
        ) : (
          <MapContainer
            center={[12.9716, 77.5946]}
            zoom={12}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <HeatmapLayer points={filteredPoints} />
          </MapContainer>
        )}

        <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex h-3 w-3 rounded-full bg-blue-500" />
            <span>Low</span>
            <span className="flex h-3 w-3 rounded-full bg-yellow-500" />
            <span>Medium</span>
            <span className="flex h-3 w-3 rounded-full bg-red-500" />
            <span>High</span>
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
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="">All Districts</option>
              {DISTRICTS.map((d) => (
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

          <Button size="sm" className="w-full" onClick={fetchCases}>
            Apply Filters
          </Button>
        </Card>

        <Card>
          <p className="text-xs font-medium text-gray-500">
            Total Incidents
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {filteredCases.length}
          </p>
        </Card>
      </div>
    </div>
  );
}
