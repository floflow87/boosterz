import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Splash from "@/pages/splash";
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
  return (
    <Switch>
      <Route path="/" component={Splash} />
      <Route path="/collections" component={Collections} />
      <Route path="/collection/:id" component={CollectionDetail} />
      <Route path="/all-cards" component={AllCards} />
      <Route path="/social" component={Social} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat/:userId" component={UserChat} />
      <Route path="/auth" component={Auth} />
      <Route path="/community" component={Community} />
      <Route path="/shop" component={Shop} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
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
