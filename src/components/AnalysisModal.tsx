import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Card } from './ui/card';
import { 
  Car, 
  Train, 
  Users, 
  Eye, 
  Shield, 
  Camera, 
  Building, 
  TreePine,
  TrendingUp,
  BarChart3,
  FileText,
  Loader2
} from 'lucide-react';
import { analyzeLocation, type LocationAnalysis } from '../lib/analysis';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: {
    id: string;
    address: string;
    lat: number;
    lng: number;
  } | null;
  onSaveAnalysis?: (locationId: string, analysis: LocationAnalysis) => void;
}

const AnalysisModal = ({ isOpen, onClose, location, onSaveAnalysis }: AnalysisModalProps) => {
  const [analysis, setAnalysis] = useState<LocationAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && location) {
      performAnalysis();
    }
  }, [isOpen, location]);

  const performAnalysis = async () => {
    if (!location) return;
    
    setIsLoading(true);
    try {
      // Simulation einer API-Anfrage mit Delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      const result = await analyzeLocation(location.lat, location.lng);
      setAnalysis(result);
      
      if (onSaveAnalysis) {
        onSaveAnalysis(location.id, result);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const criteriaData = analysis ? [
    { icon: Car, label: 'Verkehrsdichte', score: analysis.traffic, description: 'Fahrzeugaufkommen und Hauptstraßennähe' },
    { icon: Train, label: 'ÖPNV-Anbindung', score: analysis.publicTransport, description: 'Bus- und Bahnanbindung' },
    { icon: Users, label: 'Fußgängerverkehr', score: analysis.pedestrians, description: 'Passantenfrequenz und Geschäftsdichte' },
    { icon: Eye, label: 'Sichtbarkeit', score: analysis.visibility, description: 'Topographie und Bebauungssituation' },
    { icon: Shield, label: 'Denkmalschutz', score: analysis.heritage, description: 'Rechtliche Beschränkungen (niedrig = besser)' },
    { icon: Camera, label: 'Tourismus-Potential', score: analysis.tourism, description: 'Attraktivität für Besucher' },
    { icon: Building, label: 'Zugänglichkeit', score: analysis.accessibility, description: 'Erreichbarkeit und Parkmöglichkeiten' },
    { icon: TreePine, label: 'Vegetation', score: analysis.trees, description: 'Bäume und Grünflächen (kann Sicht behindern)' },
  ] : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Standort-Analyse
          </DialogTitle>
          {location && (
            <p className="text-sm text-muted-foreground">
              {location.address}
            </p>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analyse läuft...</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Wir analysieren POI-Daten, Verkehrssituation, Denkmalschutz und weitere Faktoren für optimale Werbe-Platzierung.
            </p>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Overall Score */}
            <Card className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Gesamt-Werbe-Potential</h3>
                  <p className="text-sm text-muted-foreground">
                    Kombinierte Bewertung aller Faktoren
                  </p>
                </div>
                <Badge 
                  variant={getScoreBadgeVariant(analysis.overallScore)}
                  className="text-lg font-bold px-4 py-2"
                >
                  {analysis.overallScore}%
                </Badge>
              </div>
              <Progress value={analysis.overallScore} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Niedrig</span>
                <span>Mittel</span>
                <span>Hoch</span>
              </div>
            </Card>

            {/* Detailed Criteria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criteriaData.map((criteria) => (
                <Card key={criteria.label} className="glass-subtle p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <criteria.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{criteria.label}</h4>
                        <Badge 
                          variant={getScoreBadgeVariant(criteria.score)}
                          className="text-xs"
                        >
                          {criteria.score}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {criteria.description}
                      </p>
                      <Progress value={criteria.score} className="h-2" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Recommendations */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Empfehlungen
              </h3>
              <div className="space-y-3">
                {analysis.overallScore >= 80 && (
                  <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-success mt-2" />
                    <p className="text-sm">
                      <strong>Exzellenter Standort:</strong> Optimal für Premium-Werbemaßnahmen mit hoher Reichweite.
                    </p>
                  </div>
                )}
                {analysis.heritage < 30 && (
                  <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-destructive mt-2" />
                    <p className="text-sm">
                      <strong>Denkmalschutz beachten:</strong> Rechtliche Prüfung vor Werbemaßnahmen erforderlich.
                    </p>
                  </div>
                )}
                {analysis.trees > 70 && (
                  <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-warning mt-2" />
                    <p className="text-sm">
                      <strong>Vegetation beachten:</strong> Sichtbarkeit kann durch Bäume eingeschränkt sein.
                    </p>
                  </div>
                )}
                {analysis.traffic > 85 && analysis.visibility > 80 && (
                  <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p className="text-sm">
                      <strong>Ideale Kombination:</strong> Hoher Verkehr und gute Sichtbarkeit für maximale Aufmerksamkeit.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  // TODO: Implement report generation
                  console.log('Generate report for:', location?.id);
                }}
                className="flex-1 bg-gradient-primary"
              >
                <FileText className="w-4 h-4 mr-2" />
                Detaillierten Bericht erstellen
              </Button>
              <Button variant="outline" onClick={onClose}>
                Schließen
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Fehler beim Laden der Analyse</p>
            <Button onClick={performAnalysis} className="mt-4">
              Erneut versuchen
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AnalysisModal;