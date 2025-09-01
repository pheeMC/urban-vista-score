import { useState } from 'react';
import { toast } from 'sonner';
import Navbar from '@/components/ui/navbar';
import Dashboard from '@/components/Dashboard';
import LeafletMap from '@/components/ui/leaflet-map';
import AnalysisModal from '@/components/AnalysisModal';
import ReportModal from '@/components/ReportModal';

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'map'>('dashboard');
  const [savedLocations, setSavedLocations] = useState<Array<{ id: string; address: string; lat: number; lng: number; overallScore?: number; scores?: { traffic: number; publicTransport: number; pedestrians: number; visibility: number; heritage: number; tourism: number; accessibility: number; trees: number; }; lastAnalyzed?: string }>>([
    {
      id: '1',
      address: 'Potsdamer Platz 1, Berlin',
      lat: 52.5096,
      lng: 13.3765,
      overallScore: 85
    },
    {
      id: '2', 
      address: 'Alexanderplatz, Berlin',
      lat: 52.5220,
      lng: 13.4134,
      overallScore: 78
    },
    {
      id: '3',
      address: 'Brandenburger Tor, Berlin',
      lat: 52.5163,
      lng: 13.3777,
      overallScore: 92
    }
  ]);
  const [analysisLocation, setAnalysisLocation] = useState<{
    id: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [reportLocation, setReportLocation] = useState<any>(null);

  const handleLocationSave = (location: { lng: number; lat: number; address: string }) => {
    const newLocation = {
      id: Date.now().toString(),
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      // Initially not analyzed; show 0 until analysis is run
      overallScore: 0,
      scores: {
        traffic: 0,
        publicTransport: 0,
        pedestrians: 0,
        visibility: 0,
        heritage: 0,
        tourism: 0,
        accessibility: 0,
        trees: 0,
      },
      lastAnalyzed: ''
    };
    
    setSavedLocations(prev => [...prev, newLocation]);
    
    toast.success('Standort gespeichert!', {
      description: `${location.address} wurde erfolgreich hinzugefügt.`,
    });
    
    setCurrentView('dashboard');
  };

  const handleAnalyze = (id: string) => {
    const location = savedLocations.find(loc => loc.id === id);
    if (location) {
      setAnalysisLocation({
        id: location.id,
        address: location.address,
        lat: location.lat,
        lng: location.lng
      });
    }
  };

  const handleGenerateReport = (id: string) => {
    const location = savedLocations.find(loc => loc.id === id);
    if (location && location.scores && location.overallScore) {
      setReportLocation({
        id: location.id,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
        scores: location.scores,
        overallScore: location.overallScore,
        lastAnalyzed: location.lastAnalyzed || new Date().toISOString().split('T')[0]
      });
    } else {
      toast.error('Bitte führen Sie zuerst eine Analyse durch', {
        description: 'Der Standort muss analysiert werden, bevor ein Bericht erstellt werden kann.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />
      
      <main className="animate-fade-in">
        {currentView === 'dashboard' ? (
          <Dashboard 
            onShowMap={() => setCurrentView('map')}
            onAnalyze={handleAnalyze}
            onGenerateReport={handleGenerateReport}
            savedLocations={savedLocations}
          />
        ) : (
          <div className="h-[calc(100vh-80px)] p-4">
            <LeafletMap 
              onLocationSave={handleLocationSave} 
              savedLocations={savedLocations}
            />
          </div>
        )}
      </main>

      <AnalysisModal
        isOpen={!!analysisLocation}
        onClose={() => setAnalysisLocation(null)}
        location={analysisLocation}
        onSaveAnalysis={(locationId, analysis) => {
          console.log('Analysis saved:', locationId, analysis);
          // Update saved location with analysis results
          setSavedLocations(prev => 
            prev.map(loc => 
              loc.id === locationId 
                ? { 
                    ...loc, 
                    scores: analysis, 
                    overallScore: analysis.overallScore,
                    lastAnalyzed: new Date().toISOString().split('T')[0]
                  }
                : loc
            )
          );
        }}
      />

      <ReportModal
        isOpen={!!reportLocation}
        onClose={() => setReportLocation(null)}
        location={reportLocation}
      />
    </div>
  );
};

export default Index;