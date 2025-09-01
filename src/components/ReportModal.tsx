import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  FileText, 
  Download, 
  Printer, 
  Share2,
  MapPin,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Car,
  Train,
  Users,
  Eye,
  Shield,
  Camera,
  Building,
  TreePine,
  Map as MapIcon
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationData {
  id: string;
  address: string;
  lat: number;
  lng: number;
  scores: {
    traffic: number;
    publicTransport: number;
    pedestrians: number;
    visibility: number;
    heritage: number;
    tourism: number;
    accessibility: number;
    trees: number;
  };
  overallScore: number;
  lastAnalyzed: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationData | null;
}

const ReportModal = ({ isOpen, onClose, location }: ReportModalProps) => {
  const [reportType, setReportType] = useState<'summary' | 'detailed'>('summary');
  const [activeTab, setActiveTab] = useState<'report' | 'map'>('report');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ [key: string]: L.TileLayer }>({});

  // WMS Layers für Berlin GDI
  const wmsLayers = [
    {
      id: 'traffic',
      name: 'Verkehrsdichte',
      url: 'https://fbinter.stadt-berlin.de/fb/wms/senstadt/k_vms2015',
      layers: 'fis:sb_vms_count_kfz',
      color: 'rgb(255, 0, 0)'
    },
    {
      id: 'publicTransport',
      name: 'ÖPNV Haltestellen',
      url: 'https://fbinter.stadt-berlin.de/fb/wms/senstadt/k_vbb',
      layers: 'fis:re_haltest',
      color: 'rgb(0, 100, 255)'
    },
    {
      id: 'heritage',
      name: 'Denkmäler',
      url: 'https://fbinter.stadt-berlin.de/fb/wms/senstadt/wmsk_denkmal',
      layers: 'fis:s_einzeldenkmal_punkt',
      color: 'rgb(139, 69, 19)'
    },
    {
      id: 'trees',
      name: 'Baumbestand',
      url: 'https://fbinter.stadt-berlin.de/fb/wms/senstadt/k_wfs_baumbestand',
      layers: 'fis:s_wfs_baumbestand',
      color: 'rgb(0, 128, 0)'
    }
  ];

  // Map initialization
  useEffect(() => {
    if (!isOpen || !location || !mapContainerRef.current || activeTab !== 'map') return;

    // Cleanup existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [location.lat, location.lng],
      zoom: 16,
      zoomControl: true
    });

    // Add base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add location marker
    const locationIcon = L.divIcon({
      html: `<div style="background: rgb(239, 68, 68); width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      className: 'custom-marker'
    });

    L.marker([location.lat, location.lng], { icon: locationIcon })
      .addTo(map)
      .bindPopup(`<strong>${location.address}</strong><br/>Score: ${location.overallScore}/100`)
      .openPopup();

    // Add WMS layers
    wmsLayers.forEach(layer => {
      const wmsLayer = L.tileLayer.wms(layer.url, {
        layers: layer.layers,
        format: 'image/png',
        transparent: true,
        attribution: 'Berlin GDI'
      });
      layersRef.current[layer.id] = wmsLayer;
      wmsLayer.addTo(map);
    });

    mapInstanceRef.current = map;

    // Ensure proper rendering after tab becomes visible
    setTimeout(() => {
      map.invalidateSize();
    }, 50);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, location, activeTab]);

  if (!location) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getRecommendationLevel = (score: number) => {
    if (score >= 80) return { level: 'Stark empfohlen', icon: CheckCircle, color: 'text-success' };
    if (score >= 60) return { level: 'Empfohlen', icon: TrendingUp, color: 'text-warning' };
    return { level: 'Nicht empfohlen', icon: AlertTriangle, color: 'text-destructive' };
  };

  const criteriaData = [
    { icon: Car, label: 'Verkehrsdichte', score: location.scores.traffic, weight: '20%' },
    { icon: Train, label: 'ÖPNV-Anbindung', score: location.scores.publicTransport, weight: '15%' },
    { icon: Users, label: 'Fußgängerverkehr', score: location.scores.pedestrians, weight: '20%' },
    { icon: Eye, label: 'Sichtbarkeit', score: location.scores.visibility, weight: '15%' },
    { icon: Shield, label: 'Denkmalschutz', score: location.scores.heritage, weight: '-10%' },
    { icon: Camera, label: 'Tourismus', score: location.scores.tourism, weight: '10%' },
    { icon: Building, label: 'Zugänglichkeit', score: location.scores.accessibility, weight: '15%' },
    { icon: TreePine, label: 'Vegetation', score: location.scores.trees, weight: '-5%' },
  ];

  const recommendation = getRecommendationLevel(location.overallScore);

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting report as ${format} for location:`, location.id);
    // TODO: Implement export functionality
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5" />
            Standort-Bericht: {location.address}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'report' | 'map')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="report" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Bericht
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapIcon className="h-4 w-4" />
              Karte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report" className="space-y-6 mt-6">
            <div className="flex gap-2 mb-4">
              <Button
                variant={reportType === 'summary' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReportType('summary')}
              >
                Zusammenfassung
              </Button>
              <Button
                variant={reportType === 'detailed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReportType('detailed')}
              >
                Detailliert
              </Button>
            </div>

            {/* Header Information */}
            <Card className="glass-card p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h2 className="text-xl font-bold">{location.address}</h2>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Analysiert am: {new Date(location.lastAnalyzed).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant={getScoreBadgeVariant(location.overallScore)}
                    className="text-lg font-bold px-4 py-2"
                  >
                    {location.overallScore}%
                  </Badge>
                </div>
                <div className={`flex items-center gap-2 ${recommendation.color}`}>
                  <recommendation.icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{recommendation.level}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Executive Summary */}
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Management Summary</h3>
            <div className="space-y-3">
              <p className="text-sm">
                Der analysierte Standort <strong>{location.address}</strong> erreicht einen 
                Gesamt-Score von <strong>{location.overallScore}%</strong> für das Werbe-Potential.
              </p>
              
              {location.overallScore >= 80 && (
                <p className="text-sm text-success">
                  ✓ <strong>Empfehlung:</strong> Dieser Standort eignet sich ausgezeichnet für Werbemaßnahmen 
                  mit hoher Reichweite und Sichtbarkeit.
                </p>
              )}
              
              {location.overallScore >= 60 && location.overallScore < 80 && (
                <p className="text-sm text-warning">
                  ⚠ <strong>Empfehlung:</strong> Dieser Standort bietet gutes Potential, 
                  sollte aber in Kombination mit anderen Maßnahmen betrachtet werden.
                </p>
              )}
              
              {location.overallScore < 60 && (
                <p className="text-sm text-destructive">
                  ⚠ <strong>Empfehlung:</strong> Alternative Standorte sollten in Betracht gezogen werden, 
                  da das Werbe-Potential eingeschränkt ist.
                </p>
              )}
            </div>
          </Card>

          {/* Detailed Analysis */}
          {reportType === 'detailed' && (
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Detaillierte Bewertung</h3>
              <div className="space-y-4">
                {criteriaData.map((criteria) => (
                  <div key={criteria.label}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <criteria.icon className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{criteria.label}</span>
                        <Badge variant="outline" className="text-xs">
                          Gewichtung: {criteria.weight}
                        </Badge>
                      </div>
                      <Badge 
                        variant={getScoreBadgeVariant(criteria.score)}
                        className="text-sm"
                      >
                        {criteria.score}%
                      </Badge>
                    </div>
                    <Progress value={criteria.score} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {criteria.label === 'Verkehrsdichte' && 'Basierend auf Straßennähe und geschätztem Fahrzeugaufkommen'}
                      {criteria.label === 'ÖPNV-Anbindung' && 'Bewertung der Bus- und Bahnanbindung im Umkreis'}
                      {criteria.label === 'Fußgängerverkehr' && 'Geschätzte Passantenfrequenz basierend auf POI-Dichte'}
                      {criteria.label === 'Sichtbarkeit' && 'Topographische Analyse und Bebauungssituation'}
                      {criteria.label === 'Denkmalschutz' && 'Wahrscheinlichkeit rechtlicher Beschränkungen'}
                      {criteria.label === 'Tourismus' && 'Attraktivität für Besucher und Touristen'}
                      {criteria.label === 'Zugänglichkeit' && 'Erreichbarkeit und verfügbare Parkmöglichkeiten'}
                      {criteria.label === 'Vegetation' && 'Bäume und Grünflächen die Sicht beeinträchtigen können'}
                    </p>
                    {criteria !== criteriaData[criteriaData.length - 1] && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendations */}
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Handlungsempfehlungen</h3>
            <div className="space-y-3">
              {location.overallScore >= 80 && (
                <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Premium-Werbemaßnahmen empfohlen</p>
                    <p className="text-xs text-muted-foreground">
                      Investieren Sie in hochwertige Werbemittel für maximale Reichweite.
                    </p>
                  </div>
                </div>
              )}
              
              {location.scores.heritage < 30 && (
                <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Rechtliche Prüfung erforderlich</p>
                    <p className="text-xs text-muted-foreground">
                      Kontaktieren Sie die örtlichen Behörden bezüglich Denkmalschutz.
                    </p>
                  </div>
                </div>
              )}
              
              {location.scores.traffic > 85 && (
                <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Optimale Verkehrslage</p>
                    <p className="text-xs text-muted-foreground">
                      Nutzen Sie Stoßzeiten für zeitgesteuerte Werbeinhalte.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                onClick={() => handleExport('pdf')}
                className="bg-gradient-primary"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF exportieren
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleExport('excel')}
              >
                <Download className="w-4 h-4 mr-2" />
                Excel exportieren
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Drucken
              </Button>
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Teilen
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" onClick={onClose}>
                Schließen
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Interaktive Karte</h3>
                <div className="text-sm text-muted-foreground">
                  Alle relevanten Datenschichten werden angezeigt
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {wmsLayers.map(layer => (
                  <div key={layer.id} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: layer.color }}
                    ></div>
                    <span>{layer.name}</span>
                  </div>
                ))}
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div 
                  ref={mapContainerRef} 
                  className="h-[500px] w-full"
                  style={{ minHeight: '500px' }}
                />
              </div>
              
              <div className="text-sm text-muted-foreground text-center">
                Diese Karte zeigt den analysierten Standort mit allen relevanten Berliner Geodaten.
                <br />
                Externe können diese Karte zur Verifikation der Analyseergebnisse nutzen.
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;