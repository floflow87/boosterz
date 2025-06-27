import { useState } from "react";
import { ArrowLeft, User, Trophy, Bell, Shield, Palette, Info } from "lucide-react";
import { useLocation } from "wouter";
import TrophiesSection from "@/components/TrophiesSection";
import { UserTrophyStats } from "@/utils/trophySystem";

export default function Settings() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('profile');

  // Mock data pour tester le système de trophées
  const mockUserStats: UserTrophyStats = {
    totalCards: 125,
    totalAutographs: 15,
    totalSpecials: 3,
    totalFollowers: 42
  };

  const sections = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'trophies', label: 'Trophées', icon: Trophy },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Confidentialité', icon: Shield },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'about', label: 'À propos', icon: Info }
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Informations du profil</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nom d'utilisateur</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                    placeholder="Votre nom d'utilisateur"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input 
                    type="email" 
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Biographie</label>
                  <textarea 
                    rows={3}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                    placeholder="Parlez-nous de vous..."
                  />
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'trophies':
        return <TrophiesSection userStats={mockUserStats} />;
      
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Préférences de notification</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Nouveaux messages</p>
                    <p className="text-gray-400 text-sm">Recevoir des notifications pour les nouveaux messages</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Nouvelles cartes</p>
                    <p className="text-gray-400 text-sm">Notifications lors de l'ajout de nouvelles cartes</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Trophées débloqués</p>
                    <p className="text-gray-400 text-sm">Notifications pour les nouveaux trophées</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Paramètres de confidentialité</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Profil public</p>
                    <p className="text-gray-400 text-sm">Permettre aux autres utilisateurs de voir votre profil</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Collection visible</p>
                    <p className="text-gray-400 text-sm">Afficher votre collection aux autres utilisateurs</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Apparence</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-white font-medium mb-3">Thème</p>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input type="radio" name="theme" className="w-4 h-4" defaultChecked />
                      <span className="text-gray-300">Sombre</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="radio" name="theme" className="w-4 h-4" />
                      <span className="text-gray-300">Clair</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="radio" name="theme" className="w-4 h-4" />
                      <span className="text-gray-300">Automatique</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'about':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">À propos de BOOSTERZ</h3>
              <div className="space-y-4 text-gray-300">
                <p>Version 1.0.0</p>
                <p>Application de collection de cartes de football</p>
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-white font-medium mb-2">Développé avec ❤️</h4>
                  <p className="text-sm">Une application moderne pour les passionnés de cartes</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(216,46%,13%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-black/20 border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLocation('/collections')}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Luckiest Guy, cursive' }}>
              Paramètres
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex max-w-6xl mx-auto">
        {/* Sidebar */}
        <div className="w-64 p-4">
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
}