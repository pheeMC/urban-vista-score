import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from './button';
import { Input } from './input';
import { Search, MapPin, Plus } from 'lucide-react';

interface MapProps {
  onLocationSave?: (location: { lng: number; lat: number; address: string }) => void;
}

const Map = ({ onLocationSave }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    lng: number;
    lat: number;
    address: string;
  } | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [10.4515, 51.1657], // Germany center
      zoom: 6,
      pitch: 0,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      
      // Reverse geocoding to get address
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`
        );
        const data = await response.json();
        const address = data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
        setSelectedLocation({ lng, lat, address });
        
        // Add marker
        new mapboxgl.Marker({
          color: 'hsl(var(--primary))',
          scale: 1.2
        })
          .setLngLat([lng, lat])
          .addTo(map.current!);
          
      } catch (error) {
        console.error('Geocoding error:', error);
        setSelectedLocation({ 
          lng, 
          lat, 
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` 
        });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  const handleSearch = async () => {
    if (!searchQuery || !mapboxToken) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&country=DE`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSaveLocation = () => {
    if (selectedLocation && onLocationSave) {
      onLocationSave(selectedLocation);
      setSelectedLocation(null);
    }
  };

  if (!mapboxToken) {
    return (
      <div className="glass-card rounded-2xl p-8 m-4 max-w-md mx-auto">
        <div className="text-center space-y-4">
          <MapPin className="w-12 h-12 mx-auto text-primary" />
          <h3 className="text-lg font-semibold">Mapbox Token erforderlich</h3>
          <p className="text-muted-foreground text-sm">
            Bitte geben Sie Ihren Mapbox Public Token ein, um die Karte zu verwenden.
          </p>
          <Input
            placeholder="Mapbox Public Token eingeben..."
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="glass-subtle"
          />
          <p className="text-xs text-muted-foreground">
            Token auf{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>{' '}
            erstellen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="glass-card rounded-2xl p-4 max-w-md">
          <div className="flex gap-2">
            <Input
              placeholder="Standort suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="glass-subtle border-0"
            />
            <Button onClick={handleSearch} variant="secondary" size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Selected Location Card */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Standort ausgewählt</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {selectedLocation.address}
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
              <Button 
                onClick={handleSaveLocation}
                size="sm"
                className="bg-gradient-primary hover:scale-105 transition-transform"
              >
                <Plus className="w-4 h-4 mr-1" />
                Speichern
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 rounded-2xl overflow-hidden" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/10 to-transparent rounded-2xl" />
    </div>
  );
};

export default Map;