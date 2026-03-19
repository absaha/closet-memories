import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Welcome() {
  return (
    <div className="min-h-screen gradient-bg relative z-10 bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-3xl mx-auto flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7L12 3L4 7V17L12 21L20 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12L20 7L12 3L4 7L12 12Z" fill="currentColor" opacity="0.3"/>
              <path d="M12 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Closet Memories</h1>
            <p className="text-muted-foreground text-lg">
              Your personal style journey starts here
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <Card className="bg-card rounded-2xl border-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-center mb-4">What you can do:</h2>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Capture your fits</p>
                  <p className="text-sm text-muted-foreground">Upload and organize your outfits</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Get friends' opinions</p>
                  <p className="text-sm text-muted-foreground">Create polls for outfit choices</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Smart suggestions</p>
                  <p className="text-sm text-muted-foreground">Get personalized style advice</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Memory notes</p>
                  <p className="text-sm text-muted-foreground">Remember special moments</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/signin" className="block">
            <Button 
              className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground py-3 px-6 rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 transition-all"
              data-testid="button-get-started"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Get Started
            </Button>
          </Link>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Ready to create your style story?
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="flex justify-center space-x-4 opacity-30">
          <div className="w-8 h-8 rounded-full bg-primary/20"></div>
          <div className="w-6 h-6 rounded-full bg-secondary/30 mt-1"></div>
          <div className="w-10 h-10 rounded-full bg-accent/20 -mt-1"></div>
          <div className="w-7 h-7 rounded-full bg-primary/30 mt-0.5"></div>
          <div className="w-5 h-5 rounded-full bg-secondary/40 mt-1.5"></div>
        </div>
      </div>
    </div>
  );
}