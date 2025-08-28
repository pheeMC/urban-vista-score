import { useState } from 'react';
import { toast } from 'sonner';
import Navbar from '@/components/ui/navbar';
import Dashboard from '@/components/Dashboard';
import LeafletMap from '@/components/ui/leaflet-map';
import AnalysisModal from '@/components/AnalysisModal';
import ReportModal from '@/components/ReportModal';

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'map'>('dashboard');
  const [analysisLocation, setAnalysisLocation] = useState<{
    id: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [reportLocation, setReportLocation] = useState<any>(null);

  const handleLocationSave = (location: { lng: number; lat: number; address: string }) => {
    console.log('Saving location:', location);
    
    toast.success('Standort gespeichert!', {
      description: `${location.address} wurde erfolgreich hinzugefügt.`,
    });
    
    setCurrentView('dashboard');
  };

  const handleAnalyze = (id: string) => {
    // TODO: Get actual location data
    const mockLocation = {
      id,
      address: 'Potsdamer Platz 1, Berlin',
      lat: 52.5096,
      lng: 13.3765
    };
    setAnalysisLocation(mockLocation);
  };

  const handleGenerateReport = (id: string) => {
    // TODO: Get actual location data
    const mockLocation = {
      id,
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
    };
    setReportLocation(mockLocation);
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
          />
        ) : (
          <div className="h-[calc(100vh-80px)] p-4">
            <LeafletMap onLocationSave={handleLocationSave} />
          </div>
        )}
      </main>

      <AnalysisModal
        isOpen={!!analysisLocation}
        onClose={() => setAnalysisLocation(null)}
        location={analysisLocation}
        onSaveAnalysis={(locationId, analysis) => {
          console.log('Analysis saved:', locationId, analysis);
          // TODO: Save analysis to database
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