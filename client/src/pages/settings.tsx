import Header from "@/components/header";
import Navigation from "@/components/navigation";
import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Settings() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[hsl(214,35%,11%)] text-white pb-20">
      <Header title="Réglages" />
      
      <div className="p-4 space-y-6">


        {/* Menu des paramètres */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-luckiest">Paramètres</h2>
          
          <div className="space-y-2">
            {[
              { icon: User, title: "Profil", subtitle: "Modifier vos informations", path: "/profile" },
              { icon: Bell, title: "Notifications", subtitle: "Gérer les alertes", path: null },
              { icon: Shield, title: "Confidentialité", subtitle: "Contrôle des données", path: null },
              { icon: HelpCircle, title: "Aide & Support", subtitle: "FAQ et contact", path: null }
            ].map((item, index) => (
              <div 
                key={index} 
                className={`bg-[hsl(214,35%,22%)] rounded-lg p-4 ${item.path ? 'cursor-pointer hover:bg-[hsl(214,35%,25%)] transition-colors' : ''}`}
                onClick={() => item.path && setLocation(item.path)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5 text-[hsl(9,85%,67%)]" />
                    <div>
                      <h3 className="font-bold font-poppins">{item.title}</h3>
                      <p className="text-sm text-[hsl(212,23%,69%)]">{item.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[hsl(212,23%,69%)]" />
                </div>
              </div>
            ))}
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

        {/* À propos */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-luckiest">Application</h2>
          
          <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[hsl(212,23%,69%)]">Version</span>
                <span className="font-poppins">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(212,23%,69%)]">Base de données</span>
                <span className="font-poppins">Score Ligue 1 2023/24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(212,23%,69%)]">Dernière mise à jour</span>
                <span className="font-poppins">Aujourd'hui</span>
              </div>
            </div>
          </div>
        </div>

        {/* Déconnexion */}
        <div className="pt-4">
          <button 
            onClick={() => {
              localStorage.removeItem('authToken');
              localStorage.removeItem('onboarding_completed');
              window.location.reload();
            }}
            className="w-full bg-red-600 hover:bg-red-700 rounded-lg p-4 flex items-center justify-center space-x-2 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold font-poppins">Se déconnecter</span>
          </button>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}