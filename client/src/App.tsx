import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Splash from "@/pages/splash";
import Start from "@/pages/start";
import Collections from "@/pages/collections";
import CollectionDetail from "@/pages/collection-detail";
import AllCards from "@/pages/all-cards";
import Social from "@/pages/social";
import Chat from "@/pages/chat";
import UserChat from "@/pages/user-chat";
import Auth from "@/pages/auth";
import Community from "@/pages/community";
import Shop from "@/pages/shop";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  // Check if user is authenticated
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const isAuthenticated = !!user;
  const isFirstLogin = user && 'isFirstLogin' in user ? user.isFirstLogin : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[hsl(9,85%,67%)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Auth} />
          <Route path="/auth" component={Auth} />
          <Route component={Auth} />
        </>
      ) : isFirstLogin ? (
        <>
          <Route path="/" component={Start} />
          <Route component={Start} />
        </>
      ) : (
        <>
          <Route path="/" component={Collections} />
          <Route path="/start" component={Start} />
          <Route path="/collections" component={Collections} />
          <Route path="/collection/:id" component={CollectionDetail} />
          <Route path="/all-cards" component={AllCards} />
          <Route path="/social" component={Social} />
          <Route path="/chat" component={Chat} />
          <Route path="/chat/:userId" component={UserChat} />
          <Route path="/community" component={Community} />
          <Route path="/shop" component={Shop} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
