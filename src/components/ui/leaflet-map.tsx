import React, { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Search, MapPin, Plus, Layers, Eye, EyeOff } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface SavedLocation {
  id: string;
  address: string;
  lat: number;
  lng: number;
  overallScore?: number;
}

interface MapProps {
  onLocationSave?: (location: { lng: number; lat: number; address: string }) => void;
  savedLocations?: SavedLocation[];
}

interface WMSLayer {
  id: string;
  name: string;
  url: string;
  layers: string;
  visible: boolean;
  color: string;
}


const LeafletMap = ({ onLocationSave, savedLocations = [] }: MapProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchMarker, setSearchMarker] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lng: number;
    lat: number;
    address: string;
  } | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const wmsLayerRefs = useRef<{ [key: string]: L.TileLayer.WMS }>({});
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const savedMarkersRef = useRef<L.Marker[]>([]);

  const [wmsLayers, setWmsLayers] = useState<WMSLayer[]>([
    {
      id: 'heritage',
      name: '🏛️ Denkmalschutz',
      url: 'https://gdi.berlin.de/services/wms/denkmale',
      layers: 'denkmale:a_baudenkmal,denkmale:b_bodendenkmal,denkmale:c_gartendenkmal,denkmale:d_denkmalbereich_gesamtanlage,denkmale:e_denkmalbereich_ensemble',
      visible: false,
      color: 'bg-amber-500'
    },
    {
      id: 'trees',
      name: '🌳 Bäume',
      url: 'https://gdi.berlin.de/services/wms/baumbestand',
      layers: 'baumbestand:strassenbaeume,baumbestand:anlagenbaeume',
      visible: false,
      color: 'bg-green-500'
    },
    {
      id: 'traffic',
      name: '🚗 Verkehrsmengen',
      url: 'https://gdi.berlin.de/services/wms/verkehrsmengen_2023',
      layers: 'dtvw2023kfz',
      visible: false,
      color: 'bg-red-500'
    },
    {
      id: 'transport',
      name: '🚋 ÖPNV',
      url: 'https://gdi.berlin.de/services/wms/oepnv_ungestoert',
      layers: 'a_busstopp,b_tramstopp',
      visible: false,
      color: 'bg-blue-500'
    }
  ]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Berlin')}&limit=5&addressdetails=1&bounded=1&viewbox=13.0883,52.3389,13.7611,52.6755&countrycodes=de`
        );
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Initialize map (Berlin bounds)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      maxBounds: [[52.3389, 13.0883], [52.6755, 13.7611]], // Berlin bounds
      maxBoundsViscosity: 1.0
    }).setView([52.5200, 13.4050], 11);
    
    // Add OpenStreetMap base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add click handler
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      handleMapClick(lat, lng);
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle WMS layer visibility changes
  useEffect(() => {
    if (!mapRef.current) return;

    wmsLayers.forEach((layer) => {
      const existingLayer = wmsLayerRefs.current[layer.id];
      
      if (layer.visible && !existingLayer) {
        // Add layer
        const wmsLayer = L.tileLayer.wms(layer.url, {
          layers: layer.layers,
          format: 'image/png',
          transparent: true,
          opacity: 0.7,
          attribution: ''
        });
        wmsLayer.addTo(mapRef.current);
        wmsLayerRefs.current[layer.id] = wmsLayer;
      } else if (!layer.visible && existingLayer) {
        // Remove layer
        mapRef.current.removeLayer(existingLayer);
        delete wmsLayerRefs.current[layer.id];
      }
    });
  }, [wmsLayers]);

  const handleSearchResultClick = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setSearchResults([]);
    setSearchQuery(result.display_name);
    
    // Set search marker
    setSearchMarker({ lat, lng, address: result.display_name });
    
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 16);
    }
  };

  const toggleLayer = (layerId: string) => {
    setWmsLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  // Handle search marker
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing search marker
    if (searchMarkerRef.current) {
      mapRef.current.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }

    // Add new search marker if location is searched
    if (searchMarker) {
      const marker = L.marker([searchMarker.lat, searchMarker.lng], {
        icon: L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        })
      })
        .bindPopup(`<strong>Suchergebnis</strong><br/>${searchMarker.address}`)
        .addTo(mapRef.current);
      searchMarkerRef.current = marker;
    }
  }, [searchMarker]);

  // Handle saved locations markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing saved markers
    savedMarkersRef.current.forEach(marker => {
      mapRef.current?.removeLayer(marker);
    });
    savedMarkersRef.current = [];

    // Add markers for all saved locations
    savedLocations.forEach((location) => {
      const marker = L.marker([location.lat, location.lng], {
        icon: L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        })
      })
        .bindPopup(`
          <div>
            <strong>Gespeicherter Standort</strong><br/>
            ${location.address}<br/>
            ${location.overallScore ? `<span style="color: #22c55e;">Score: ${location.overallScore}/100</span>` : ''}
          </div>
        `)
        .addTo(mapRef.current!);
      
      savedMarkersRef.current.push(marker);
    });
  }, [savedLocations]);

  // Handle selected location marker  
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing marker
    if (selectedMarkerRef.current) {
      mapRef.current.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }

    // Add new marker if location is selected
    if (selectedLocation) {
      const marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        })
      })
        .bindPopup(`<strong>Neuer Standort</strong><br/>${selectedLocation.address}`)
        .addTo(mapRef.current);
      selectedMarkerRef.current = marker;
    }
  }, [selectedLocation]);

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
      // Clear search marker when saving
      setSearchMarker(null);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <div className="glass-card rounded-2xl p-4 max-w-md">
          <div className="relative">
            <div className="flex gap-2">
              <Input
                placeholder="Adresse in Berlin eingeben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-subtle border-0"
              />
              <Button 
                onClick={() => setShowLayerPanel(!showLayerPanel)} 
                variant="secondary" 
                size="icon"
              >
                <Layers className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full text-left p-3 hover:bg-white/10 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="text-sm font-medium truncate">{result.display_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Layer Panel */}
      {showLayerPanel && (
        <div className="absolute top-4 right-4 z-[1000] w-64">
          <div className="glass-card rounded-2xl p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Karten-Layer
            </h3>
            <div className="space-y-2">
              {wmsLayers.map((layer) => (
                <div key={layer.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${layer.color}`} />
                    <span className="text-sm">{layer.name}</span>
                  </div>
                  <Button
                    onClick={() => toggleLayer(layer.id)}
                    variant="ghost"
                    size="sm"
                  >
                    {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* Map */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default LeafletMap;