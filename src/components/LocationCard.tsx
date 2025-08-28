import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { 
  MapPin, 
  Eye, 
  Car, 
  Train, 
  Users, 
  Building, 
  TreePine,
  Shield,
  Camera,
  MoreHorizontal
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

interface LocationCardProps {
  location: LocationData;
  onAnalyze: (id: string) => void;
  onGenerateReport: (id: string) => void;
}

const LocationCard = ({ location, onAnalyze, onGenerateReport }: LocationCardProps) => {
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

  const criteriaData = [
    { icon: Car, label: 'Verkehr', score: location.scores.traffic },
    { icon: Train, label: 'ÖPNV', score: location.scores.publicTransport },
    { icon: Users, label: 'Fußgänger', score: location.scores.pedestrians },
    { icon: Eye, label: 'Sichtbarkeit', score: location.scores.visibility },
    { icon: Shield, label: 'Denkmalschutz', score: location.scores.heritage },
    { icon: Camera, label: 'Tourismus', score: location.scores.tourism },
    { icon: Building, label: 'Zugänglichkeit', score: location.scores.accessibility },
    { icon: TreePine, label: 'Vegetation', score: location.scores.trees },
  ];

  return (
    <Card className="glass-card p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm truncate">{location.address}</h3>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={getScoreBadgeVariant(location.overallScore)}
            className="font-bold"
          >
            {location.overallScore}%
          </Badge>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium">Werbe-Potential</span>
          <span className={`text-xs font-bold ${getScoreColor(location.overallScore)}`}>
            {location.overallScore}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-primary transition-all duration-1000 ease-out"
            style={{ width: `${location.overallScore}%` }}
          />
        </div>
      </div>

      {/* Criteria Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {criteriaData.map((criteria) => (
          <div key={criteria.label} className="text-center">
            <div className="glass-subtle rounded-lg p-2 mb-2">
              <criteria.icon className="w-4 h-4 mx-auto text-muted-foreground" />
            </div>
            <div className={`text-xs font-bold ${getScoreColor(criteria.score)}`}>
              {criteria.score}%
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {criteria.label}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          onClick={() => onAnalyze(location.id)}
          variant="secondary" 
          size="sm"
          className="flex-1 glass-subtle"
        >
          <Eye className="w-4 h-4 mr-1" />
          Analysieren
        </Button>
        <Button 
          onClick={() => onGenerateReport(location.id)}
          size="sm"
          className="flex-1 bg-gradient-primary hover:scale-105 transition-transform"
        >
          Bericht erstellen
        </Button>
      </div>

      {/* Last analyzed */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          Zuletzt analysiert: {new Date(location.lastAnalyzed).toLocaleDateString('de-DE')}
        </p>
      </div>
    </Card>
  );
};

export default LocationCard;