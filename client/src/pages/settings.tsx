import Header from "@/components/header";
import Navigation from "@/components/navigation";
import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight } from "lucide-react";

export default function Settings() {
  return (
    <div className="min-h-screen bg-[hsl(214,35%,11%)] text-white pb-20">
      <Header title="Réglages" />
      
      <div className="p-4 space-y-6">
        {/* Profil utilisateur */}
        <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold font-poppins">FLORENT MARTIN</h2>
              <p className="text-[hsl(212,23%,69%)]">@flo87</p>
              <p className="text-sm text-[hsl(212,23%,69%)]">Membre depuis 2023</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[hsl(212,23%,69%)]" />
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[hsl(9,85%,67%)]">387</div>
            <div className="text-xs text-[hsl(212,23%,69%)]">Cartes totales</div>
          </div>
          <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[hsl(9,85%,67%)]">1</div>
            <div className="text-xs text-[hsl(212,23%,69%)]">Collections</div>
          </div>
          <div className="bg-[hsl(214,35%,22%)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[hsl(9,85%,67%)]">15%</div>
            <div className="text-xs text-[hsl(212,23%,69%)]">Complétude</div>
          </div>
        </div>

        {/* Menu des paramètres */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-luckiest">Paramètres</h2>
          
          <div className="space-y-2">
            {[
              { icon: User, title: "Profil", subtitle: "Modifier vos informations" },
              { icon: Bell, title: "Notifications", subtitle: "Gérer les alertes" },
              { icon: Shield, title: "Confidentialité", subtitle: "Contrôle des données" },
              { icon: HelpCircle, title: "Aide & Support", subtitle: "FAQ et contact" }
            ].map((item, index) => (
              <div key={index} className="bg-[hsl(214,35%,22%)] rounded-lg p-4">
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
          <button className="w-full bg-red-600 hover:bg-red-700 rounded-lg p-4 flex items-center justify-center space-x-2 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-bold font-poppins">Se déconnecter</span>
          </button>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}