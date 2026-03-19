import { createContext, useContext, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TrialContextType {
  isTrialMode: boolean;
  promptForSignup: () => void;
  checkInteraction: (callback: () => void) => void;
}

const TrialContext = createContext<TrialContextType | undefined>(undefined);

export function TrialProvider({ children, isAuthenticated }: { children: React.ReactNode; isAuthenticated: boolean }) {
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  
  const isTrialMode = !isAuthenticated;

  const promptForSignup = () => {
    setShowSignupPrompt(true);
  };

  const checkInteraction = (callback: () => void) => {
    if (isTrialMode) {
      promptForSignup();
    } else {
      callback();
    }
  };

  const handleSignup = () => {
    window.location.href = "/api/login";
  };

  return (
    <TrialContext.Provider value={{ isTrialMode, promptForSignup, checkInteraction }}>
      {children}
      
      <Dialog open={showSignupPrompt} onOpenChange={setShowSignupPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Ready to start your style journey? ✨
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Create your free account to upload outfits, share with friends, and get personalized style suggestions!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
              <div>
                <div className="text-2xl mb-1">📷</div>
                <div>Upload & organize outfits</div>
              </div>
              <div>
                <div className="text-2xl mb-1">👥</div>
                <div>Share with friends</div>
              </div>
              <div>
                <div className="text-2xl mb-1">🤖</div>
                <div>AI style suggestions</div>
              </div>
            </div>
            
            <Button 
              onClick={handleSignup}
              className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground py-3 text-lg font-semibold"
              data-testid="button-trial-signup"
            >
              Create Free Account
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setShowSignupPrompt(false)}
              className="w-full"
              data-testid="button-trial-continue"
            >
              Continue exploring
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TrialContext.Provider>
  );
}

export function useTrial() {
  const context = useContext(TrialContext);
  if (context === undefined) {
    throw new Error("useTrial must be used within a TrialProvider");
  }
  return context;
}