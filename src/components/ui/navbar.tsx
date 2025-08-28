import React from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { 
  Building2, 
  Map, 
  BarChart3, 
  FileText, 
  Settings, 
  User,
  Bell
} from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'map';
  onViewChange: (view: 'dashboard' | 'map') => void;
}

const Navbar = ({ currentView, onViewChange }: NavbarProps) => {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: BarChart3,
      count: 3
    },
    {
      id: 'map' as const,
      label: 'Karte',
      icon: Map,
      count: null
    }
  ];

  return (
    <nav className="glass-card border-b border-border/50 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-xl">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">PropAnalytica</h1>
            <p className="text-xs text-muted-foreground">Immobilien Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange(item.id)}
              className={
                currentView === item.id 
                  ? 'bg-gradient-primary shadow-elegant' 
                  : 'glass-subtle hover:bg-muted/50'
              }
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
              {item.count && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {item.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="glass-subtle">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="glass-subtle">
            <Settings className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;