import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { TrialProvider } from "@/contexts/TrialContext";
import Landing from "@/pages/Landing";
import Media from "@/pages/Media";
import Home from "@/pages/home";
import Poll from "@/pages/poll";
import Category from "@/pages/category";
import Friends from "@/pages/friends";
import TagOutfit from "@/pages/TagOutfit";
import Wishlist from "@/pages/Wishlist";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, error } = useAuth();

  // Don't show loading for too long, especially if there's an auth error
  const showLoading = isLoading && !error;

  if (showLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center relative z-10 bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/home" component={Home} />
        <Route path="/demo">{() => <Redirect to="/" />}</Route>
        <Route path="/media" component={() => <Media isAuthenticated={true} />} />
        <Route path="/friends" component={Friends} />
        <Route path="/wishlist" component={Wishlist} />
        <Route path="/tag-outfit/:photoURL*" component={TagOutfit} />
        <Route path="/poll/:shareLink" component={Poll} />
        <Route path="/category/:type" component={Category} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/demo" component={Home} />
      <Route path="/media" component={() => <Media isAuthenticated={false} />} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/poll/:shareLink" component={Poll} />
      <Route path="/friends" component={Friends} />
      <Route path="/category/:type" component={Category} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppWithAuth />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppWithAuth() {
  const { isAuthenticated } = useAuth();
  
  return (
    <TrialProvider isAuthenticated={isAuthenticated}>
      <Toaster />
      <Router />
    </TrialProvider>
  );
}

export default App;
