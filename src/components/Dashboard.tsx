import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import LocationCard from './LocationCard';
import { 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  BarChart3, 
  FileText,
  TrendingUp,
  Eye,
  Grid3X3
} from 'lucide-react';

interface DashboardProps {
  onShowMap: () => void;
  onAnalyze: (id: string) => void;
  onGenerateReport: (id: string) => void;
}

const Dashboard = ({ onShowMap, onAnalyze, onGenerateReport }: DashboardProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Mock data for saved locations
  const mockLocations = [
    {
      id: '1',
      address: 'Potsdamer Platz 1, Berlin',
      lat: 52.5096, 
      lng: 13.3765,
      scores: {
        traffic: 95,
        publicTransport: 90,
        pedestrians: 88,
        visibility: 92,
        heritage: 45,
        tourism: 85,
        accessibility: 78,
        trees: 65
      },
      overallScore: 80,
      lastAnalyzed: '2024-01-15'
    },
    {
      id: '2',
      address: 'Marienplatz 8, München',
      lat: 48.1374,
      lng: 11.5755,
      scores: {
        traffic: 82,
        publicTransport: 85,
        pedestrians: 90,
        visibility: 88,
        heritage: 30,
        tourism: 95,
        accessibility: 70,
        trees: 40
      },
      overallScore: 73,
      lastAnalyzed: '2024-01-12'
    },
    {
      id: '3',
      address: 'Königsallee 60, Düsseldorf',
      lat: 51.2254,
      lng: 6.7763,
      scores: {
        traffic: 75,
        publicTransport: 70,
        pedestrians: 85,
        visibility: 80,
        heritage: 60,
        tourism: 65,
        accessibility: 75,
        trees: 55
      },
      overallScore: 71,
      lastAnalyzed: '2024-01-10'
    }
  ];

  const filteredLocations = mockLocations.filter(location => {
    const matchesSearch = location.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    
    const score = location.overallScore;
    if (selectedFilter === 'high') return matchesSearch && score >= 80;
    if (selectedFilter === 'medium') return matchesSearch && score >= 60 && score < 80;
    if (selectedFilter === 'low') return matchesSearch && score < 60;
    
    return matchesSearch;
  });

  const getFilterCount = (filter: typeof selectedFilter) => {
    if (filter === 'all') return mockLocations.length;
    
    return mockLocations.filter(location => {
      const score = location.overallScore;
      if (filter === 'high') return score >= 80;
      if (filter === 'medium') return score >= 60 && score < 80;
      if (filter === 'low') return score < 60;
      return false;
    }).length;
  };

  const avgScore = Math.round(
    mockLocations.reduce((sum, loc) => sum + loc.overallScore, 0) / mockLocations.length
  );


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Immobilien Portal
          </h1>
          <p className="text-muted-foreground text-sm">
            Werbe-Potential von Standorten analysieren und bewerten
          </p>
        </div>
        <Button 
          onClick={onShowMap}
          className="bg-gradient-primary hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuer Standort
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gespeicherte Standorte</p>
              <p className="text-xl font-bold">{mockLocations.length}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Durchschnittsscore</p>
              <p className="text-xl font-bold">{avgScore}%</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Eye className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Analysiert heute</p>
              <p className="text-xl font-bold">2</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileText className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Berichte erstellt</p>
              <p className="text-xl font-bold">8</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Standorte durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-subtle"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          {([
            { key: 'all' as const, label: 'Alle', count: getFilterCount('all') },
            { key: 'high' as const, label: 'Hoch', count: getFilterCount('high') },
            { key: 'medium' as const, label: 'Mittel', count: getFilterCount('medium') },
            { key: 'low' as const, label: 'Niedrig', count: getFilterCount('low') }
          ]).map(filter => (
            <Button
              key={filter.key}
              variant={selectedFilter === filter.key ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedFilter(filter.key)}
              className={selectedFilter === filter.key ? 'bg-gradient-primary' : 'glass-subtle'}
            >
              {filter.label}
              <Badge variant="secondary" className="ml-2 text-xs">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Standorte ({filteredLocations.length})
          </h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <BarChart3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {filteredLocations.length === 0 ? (
          <Card className="glass-card p-8 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Standorte gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Versuchen Sie andere Suchbegriffe.' : 'Fügen Sie Ihren ersten Standort hinzu.'}
            </p>
            <Button onClick={onShowMap} className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Standort hinzufügen
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocations.map(location => (
              <LocationCard
                key={location.id}
                location={location}
                onAnalyze={onAnalyze}
                onGenerateReport={onGenerateReport}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;