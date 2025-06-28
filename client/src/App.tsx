import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Splash from "@/pages/splash";
import Home from "@/pages/home";
import Collections from "@/pages/collections";
import CollectionDetail from "@/pages/collection-detail";
import AllCards from "@/pages/all-cards";
import Social from "@/pages/social";
import Chat from "@/pages/chat";
import UserChat from "@/pages/user-chat";
import Conversations from "@/pages/conversations";
import Auth from "@/pages/auth";
import Community from "@/pages/community";
import Shop from "@/pages/shop";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import ProfileEdit from "@/pages/profile-edit";
import Trophies from "@/pages/trophies";
import UserProfile from "@/pages/user-profile";
import Feed from "@/pages/feed";
import Welcome from "@/pages/welcome";
import Landing from "@/pages/landing";
import CardExamples from "@/pages/card-examples";
import AddCard from "@/pages/add-card";
import CreateDeck from "@/pages/create-deck";
import DeckDetail from "@/pages/deck-detail";
import NotFound from "@/pages/not-found";

function Router() {
  const authToken = localStorage.getItem('authToken');
  const onboardingCompleted = localStorage.getItem('onboarding_completed');
  
  // Check authentication state
  if (!authToken) {
    return <Landing />;
  }
  
  // Check if user needs onboarding
  if (!onboardingCompleted) {
    return <Welcome />;
  }

  return (
    <Switch>
      <Route path="/" component={Social} />
      <Route path="/home" component={Home} />
      <Route path="/collections" component={Collections} />
      <Route path="/collection/:id" component={CollectionDetail} />
      <Route path="/all-cards" component={AllCards} />
      <Route path="/social" component={Social} />
      <Route path="/profile/:userId" component={Profile} />
      <Route path="/feed" component={Feed} />
      <Route path="/conversations" component={Conversations} />
      <Route path="/chat/:userId" component={Chat} />
      <Route path="/community" component={Community} />
      <Route path="/shop" component={Shop} />
      <Route path="/settings" component={Settings} />
      <Route path="/trophies" component={Trophies} />
      <Route path="/profile" component={ProfileEdit} />
      <Route path="/profile/:userId" component={Profile} />
      <Route path="/user/:userId" component={UserProfile} />
      <Route path="/add-card" component={AddCard} />
      <Route path="/decks" component={Home} />
      <Route path="/create-deck" component={CreateDeck} />
      <Route path="/deck/:id" component={DeckDetail} />
      <Route path="/card-examples" component={CardExamples} />
      <Route path="/welcome" component={Welcome} />
      <Route path="/landing" component={Landing} />
      <Route path="/login" component={Landing} />
      <Route path="/logo" component={() => <div className="min-h-screen bg-[hsl(216,46%,13%)] text-white flex items-center justify-center"><div className="text-center"><h1 className="text-3xl font-bold mb-4">Logo Page</h1><p className="text-gray-400">Page logo disponible</p></div></div>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;
