import { useState } from "react";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import HaloBlur from "@/components/halo-blur";
import NotificationsModal from "@/components/NotificationsModal";
import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Settings() {
  const [, setLocation] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="min-h-screen bg-[hsl(214,35%,11%)] text-white pb-20 relative overflow-hidden">
      <HaloBlur />
      <Header title="Réglages" />
      
      <div className="relative z-10 p-4 space-y-6">


        {/* Menu des paramètres */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-luckiest">Paramètres</h2>
          
          <div className="space-y-2">
            {/* Profil */}
            <div 
              className="bg-[hsl(214,35%,22%)] rounded-lg p-4 cursor-pointer hover:bg-[hsl(214,35%,25%)] transition-colors"
              onClick={() => setLocation("/profile")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-[hsl(9,85%,67%)]" />
                  <div>
                    <h3 className="font-bold font-poppins">Profil</h3>
                    <p className="text-sm text-[hsl(212,23%,69%)]">Modifier vos informations</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[hsl(212,23%,69%)]" />
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4 cursor-pointer hover:bg-[hsl(214,35%,25%)] transition-colors">
              <button 
                className="w-full text-left"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("🔔 NOTIFICATIONS BUTTON CLICKED!");
                  setShowNotifications(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-[hsl(9,85%,67%)]" />
                    <div>
                      <h3 className="font-bold font-poppins">Notifications</h3>
                      <p className="text-sm text-[hsl(212,23%,69%)]">Gérer les alertes</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[hsl(212,23%,69%)]" />
                </div>
              </button>
            </div>

            {/* Confidentialité */}
            <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-[hsl(9,85%,67%)]" />
                  <div>
                    <h3 className="font-bold font-poppins">Confidentialité</h3>
                    <p className="text-sm text-[hsl(212,23%,69%)]">Contrôle des données</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[hsl(212,23%,69%)]" />
              </div>
            </div>

            {/* Aide & Support */}
            <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <HelpCircle className="w-5 h-5 text-[hsl(9,85%,67%)]" />
                  <div>
                    <h3 className="font-bold font-poppins">Aide & Support</h3>
                    <p className="text-sm text-[hsl(212,23%,69%)]">FAQ et contact</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[hsl(212,23%,69%)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Préférences */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-luckiest">Préférences</h2>
          
          <div className="space-y-2">
            {[
              { title: "Mode sombre", subtitle: "Toujours activé", toggle: true },
              { title: "Notifications push", subtitle: "Alertes en temps réel", toggle: true },
              { title: "Sons", subtitle: "Effets sonores", toggle: false },
              { title: "Synchronisation", subtitle: "Sauvegarde automatique", toggle: true }
            ].map((pref, index) => (
              <div key={index} className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold font-poppins">{pref.title}</h3>
                    <p className="text-sm text-[hsl(212,23%,69%)]">{pref.subtitle}</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    pref.toggle ? 'bg-[hsl(9,85%,67%)]' : 'bg-gray-600'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      pref.toggle ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>



        {/* Revoir la visite guidée */}
        <div className="pt-4">
          <button 
            onClick={() => {
              localStorage.removeItem('onboarding_completed');
              setLocation('/welcome');
            }}
            className="w-full bg-[hsl(214,35%,22%)] hover:bg-[hsl(214,35%,30%)] rounded-lg p-4 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-5 h-5 text-[hsl(9,85%,67%)]" />
              <div className="text-left">
                <h3 className="font-bold font-poppins">Revoir la visite guidée</h3>
                <p className="text-sm text-[hsl(212,23%,69%)]">Reprendre l'introduction</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[hsl(212,23%,69%)]" />
          </button>
        </div>

        {/* Déconnexion */}
        <div className="pt-4">
          <button 
            onClick={() => {
              localStorage.removeItem('authToken');
              localStorage.removeItem('onboarding_completed');
              window.location.reload();
            }}
            className="w-full bg-transparent border-2 border-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,67%)]/10 rounded-lg p-4 flex items-center justify-center space-x-2 transition-colors"
          >
            <LogOut className="w-5 h-5 text-[hsl(9,85%,67%)]" />
            <span className="font-bold font-poppins text-[hsl(9,85%,67%)]">Se déconnecter</span>
          </button>
        </div>
      </div>
      
      <Navigation />
      
      {/* Modal de notifications */}
      <NotificationsModal 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}