import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Search, MapPin, Plus } from 'lucide-react';

interface MapProps {
  onLocationSave?: (location: { lng: number; lat: number; address: string }) => void;
}

const LeafletMap = ({ onLocationSave }: MapProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    lng: number;
    lat: number;
    address: string;
  } | null>(null);

  const handleSearch = async () => {
    if (!searchQuery) return;
    // TODO: Implement search with OpenStreetMap Nominatim
    console.log('Search:', searchQuery);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      
      setSelectedLocation({ lng, lat, address });
    } catch (error) {
      console.error('Geocoding error:', error);
      setSelectedLocation({ 
        lng, 
        lat, 
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` 
      });
    }
  };

  const handleSaveLocation = () => {
    if (selectedLocation && onLocationSave) {
      onLocationSave(selectedLocation);
      setSelectedLocation(null);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
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
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Standort ausgewählt</h4>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
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

      {/* Map Placeholder */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden bg-muted">
        <div className="flex items-center justify-center h-full">
          <div className="glass-card p-8 text-center">
            <MapPin className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">OpenStreetMap Integration</h3>
            <p className="text-muted-foreground text-sm">
              Kartenintegration wird implementiert...
            </p>
            <Button 
              onClick={() => handleMapClick(52.5096, 13.3765)}
              className="mt-4"
              variant="outline"
            >
              Demo Standort (Berlin)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeafletMap;