import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';

// Standard Leaflet marker icon CDN config to bypass React local import failures
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helper component that dynamically flies to new coordinate anchors when selection changes
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 12, { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function MapView({ center, properties = [] }) {
  const mapRef = useRef();

  return (
    <div className="h-full w-full rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-900 relative min-h-[400px]">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full z-10"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          className="map-tiles"
        />
        <ChangeView center={center} />
        {(() => {
          const coordinateCounts = {};
          return properties.map((property) => {
            let lat = property.location?.coordinates?.[1];
            let lng = property.location?.coordinates?.[0];
            
            if (!lat || !lng) return null;
            
            const coordKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
            if (coordinateCounts[coordKey] !== undefined) {
              const count = coordinateCounts[coordKey] + 1;
              coordinateCounts[coordKey] = count;
              
              // Apply a small visual offset in a circular pattern (~880 meters) so overlapping pins separate
              const angle = (count * 2 * Math.PI) / 8;
              const offsetRadius = 0.008;
              lat = lat + Math.sin(angle) * offsetRadius;
              lng = lng + Math.cos(angle) * offsetRadius;
            } else {
              coordinateCounts[coordKey] = 0;
            }

            return (
              <Marker key={property._id} position={[lat, lng]} icon={defaultIcon}>
                <Popup>
                  <div className="w-48 p-1.5 space-y-2.5">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950">
                      <img
                        src={property.images?.[0]?.url}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{property.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{property.city}, {property.state}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-xs font-extrabold text-amber-600">
                        ₹{property.price.toLocaleString('en-IN')}/mo
                      </span>
                      <Link
                        to={`/properties/${property._id}`}
                        className="text-[10px] font-bold text-brand-500 hover:underline"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          });
        })()}
      </MapContainer>
    </div>
  );
}
