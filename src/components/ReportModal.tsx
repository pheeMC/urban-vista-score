import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
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
  TreePine
} from 'lucide-react';

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Werbe-Potential Bericht
          </DialogTitle>
          <div className="flex gap-2">
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
        </DialogHeader>

        <div className="space-y-6">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;