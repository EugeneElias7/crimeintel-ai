import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Crosshair } from 'lucide-react';
import Button from './Button';

// Fix default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946]; // Bengaluru

type LatLng = { lat: number; lng: number };

function ClickHandler({ onPick }: { onPick: (ll: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center.lat, center.lng]);
  return null;
}

export interface MapPickerValue {
  latitude: number | null;
  longitude: number | null;
  location_name: string;
  formatted_address: string;
  district: string;
  state: string;
}

export default function MapPicker({
  value,
  onChange,
}: {
  value: MapPickerValue;
  onChange: (v: MapPickerValue) => void;
}) {
  const [pos, setPos] = useState<LatLng | null>(
    value.latitude !== null && value.longitude !== null ? { lat: value.latitude, lng: value.longitude } : null
  );
  const [search, setSearch] = useState(value.location_name || '');
  const [searching, setSearching] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Keep pos in sync when value changes externally
  useEffect(() => {
    if (value.latitude !== null && value.longitude !== null) {
      setPos({ lat: value.latitude, lng: value.longitude });
    }
  }, [value.latitude, value.longitude]);

  const reverseGeocode = async (ll: LatLng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${ll.lat}&lon=${ll.lng}&zoom=10&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) throw new Error('Geocode failed');
      const data = await res.json();
      const addr = data.address || {};
      const formatted = data.display_name || `${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}`;
      const district = addr.state_district || addr.county || addr.city || addr.town || addr.village || '';
      const state = addr.state || '';
      const locName = addr.road || addr.suburb || addr.city || formatted.split(',')[0];
      return { formatted, district, state, locName };
    } catch {
      return {
        formatted: `${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}`,
        district: '',
        state: '',
        locName: `${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}`,
      };
    }
  };

  const handlePick = async (ll: LatLng) => {
    setPos(ll);
    const rev = await reverseGeocode(ll);
    onChange({
      latitude: ll.lat,
      longitude: ll.lng,
      location_name: rev.locName,
      formatted_address: rev.formatted,
      district: rev.district,
      state: rev.state,
    });
    setSearch(rev.locName);
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setGpsError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=1&addressdetails=1`
      );
      const data = await res.json();
      if (!data || data.length === 0) {
        setGpsError('Location not found. Try different search.');
        return;
      }
      const it = data[0];
      const ll = { lat: parseFloat(it.lat), lng: parseFloat(it.lon) };
      const addr = it.address || {};
      onChange({
        latitude: ll.lat,
        longitude: ll.lng,
        location_name: it.display_name?.split(',')[0] || search,
        formatted_address: it.display_name,
        district: addr.state_district || addr.county || addr.city || '',
        state: addr.state || '',
      });
      setPos(ll);
    } catch {
      setGpsError('Search failed. Try manually clicking on map.');
    } finally {
      setSearching(false);
    }
  };

  const handleUseMyLocation = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const ll = { lat: p.coords.latitude, lng: p.coords.longitude };
        await handlePick(ll);
      },
      () => setGpsError('Unable to access your current location. Please select the location manually on the map.'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const center = pos || { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field w-full pl-9 pr-3 !py-2 text-sm"
            placeholder="Search location/address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch} disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleUseMyLocation} title="Use my current location">
          <Crosshair size={14} /> Use My Location
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-(--color-border-primary)">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={11}
          style={{ height: '300px', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          <Recenter center={center} />
          {pos && (
            <Marker
              position={[pos.lat, pos.lng]}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const ll = e.target.getLatLng();
                  handlePick({ lat: ll.lat, lng: ll.lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {gpsError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{gpsError}</p>
      )}

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-(--color-slate-50) border border-(--color-border-primary) p-2.5">
          <p className="text-(--color-text-tertiary)">Latitude</p>
          <p className="font-mono font-medium text-(--color-text-primary)">
            {value.latitude !== null ? value.latitude.toFixed(6) : '—'}
          </p>
        </div>
        <div className="rounded-lg bg-(--color-slate-50) border border-(--color-border-primary) p-2.5">
          <p className="text-(--color-text-tertiary)">Longitude</p>
          <p className="font-mono font-medium text-(--color-text-primary)">
            {value.longitude !== null ? value.longitude.toFixed(6) : '—'}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-(--color-slate-50) border border-(--color-border-primary) p-2.5">
        <p className="text-xs text-(--color-text-tertiary) flex items-center gap-1">
          <MapPin size={12} /> Address / Location
        </p>
        <p className="text-sm font-medium text-(--color-text-primary) mt-1 min-h-[1.25rem]">
          {value.formatted_address || value.location_name || <span className="text-(--color-text-tertiary) font-normal">Click on map to select location</span>}
        </p>
        {value.district && (
          <p className="text-xs text-(--color-text-secondary) mt-1">
            {value.district}
            {value.state ? `, ${value.state}` : ''}
          </p>
        )}
      </div>

      <p className="text-[11px] text-(--color-text-tertiary)">
        Tip: Click anywhere on map to drop pin • Drag pin to adjust
      </p>
    </div>
  );
}
