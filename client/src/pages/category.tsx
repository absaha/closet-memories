import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { sounds, initAudio } from "@/lib/sounds";
import type { Item } from "@shared/schema";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

// Mock user ID for demo - in real app this would come from auth
const MOCK_USER_ID = "user-123";

export default function Category() {
  const [, params] = useRoute("/category/:type");
  const categoryType = params?.type;
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    initAudio();
  }, []);

  const handleBack = () => {
    sounds.click();
    setLocation(isAuthenticated ? "/" : "/demo");
  };
  
  // Fetch user's items - use demo items for unauthenticated users
  const { data: items = [], isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: isAuthenticated ? ["/api/items"] : ["/api/demo/items"],
    queryFn: async () => {
      const endpoint = isAuthenticated ? `/api/items?userId=${MOCK_USER_ID}` : "/api/demo/items";
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json();
    }
  });

  const getCategoryIcon = (type: string) => {
    const iconProps = "w-6 h-6";
    switch (type) {
      case 'casual': 
        return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>;
      case 'dressy': 
        return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>;
      case 'party': 
        return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>;
      case 'work': 
        return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8" />
        </svg>;
      default: 
        return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>;
    }
  };

  const getCategoryTitle = (type: string) => {
    switch (type) {
      case 'casual': return 'Casual Fits';
      case 'dressy': return 'Dressy Outfits';
      case 'party': return 'Party Looks';
      case 'work': return 'Work Attire';
      default: return 'Outfits';
    }
  };

  // Filter items by category (for now showing all since we don't have category tagging yet)
  const filteredItems = items.filter(item => {
    if (!item.tags) return false;
    return item.tags.some(tag => 
      tag.toLowerCase().includes(categoryType?.toLowerCase() || '')
    );
  });

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen gradient-bg relative z-10 bg-background">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-40 border-b border-border" data-testid="header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="p-2 hover:bg-muted rounded-lg"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
                {getCategoryIcon(categoryType || '')}
              </div>
              <h1 className="text-xl font-bold text-foreground">
                {getCategoryTitle(categoryType || '')}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Category Info */}
        <section className="mb-8">
          <Card className="bg-card rounded-2xl border-border">
            <CardContent className="p-6 text-center">
              <div className="mb-3 flex justify-center text-primary">
                {getCategoryIcon(categoryType || '')}
              </div>
              <h2 className="text-2xl font-bold mb-2">{getCategoryTitle(categoryType || '')}</h2>
              <p className="text-muted-foreground mb-4">
                {filteredItems.length} outfit{filteredItems.length !== 1 ? 's' : ''} in this category
              </p>
              <div className="text-sm text-muted-foreground">
                {categoryType === 'casual' && "Perfect for everyday comfort and style"}
                {categoryType === 'dressy' && "Looking elegant and sophisticated"}
                {categoryType === 'party' && "Time to shine and have fun"}
                {categoryType === 'work' && "Professional and polished looks"}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Outfit Gallery */}
        <section className="mb-8">
          {itemsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
                  <div className="w-full h-48 bg-muted"></div>
                  <div className="p-3">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <Card className="bg-card rounded-2xl border-border">
              <CardContent className="p-8 text-center">
                <div className="mb-4 flex justify-center text-primary">
                  {getCategoryIcon(categoryType || '')}
                </div>
                <h3 className="text-lg font-semibold mb-2">No {categoryType} outfits yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload some outfits and tag them as "{categoryType}" to see them here!
                </p>
                <Button 
                  onClick={() => window.location.href = "/"}
                  data-testid="button-add-outfits"
                >
                  Add {categoryType} outfits
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div 
                  key={item.id}
                  className="outfit-card bg-card rounded-2xl overflow-hidden border border-border cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
                  data-testid={`card-outfit-${item.id}`}
                >
                  <img 
                    src={item.photoURL} 
                    alt="Outfit" 
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-3">
                    <div className="text-sm text-muted-foreground mb-1">
                      {formatDate(item.dateAdded)}
                    </div>
                    <p className="text-sm text-foreground font-medium line-clamp-2">
                      {item.memoryNote || "No description"}
                    </p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center mt-2 text-xs text-muted-foreground flex-wrap gap-1">
                        {item.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="bg-secondary/20 px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tips Section */}
        <section className="mb-8">
          <Card className="bg-card rounded-2xl border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">💡 Style Tips</h3>
              {categoryType === 'casual' && (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Mix comfortable basics with fun accessories</p>
                  <p>• Layering is your best friend for versatile looks</p>
                  <p>• Don't forget comfortable shoes for all-day wear</p>
                </div>
              )}
              {categoryType === 'dressy' && (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• A little black dress is always a good choice</p>
                  <p>• Add statement jewelry to elevate your look</p>
                  <p>• Don't forget about proper fitting undergarments</p>
                </div>
              )}
              {categoryType === 'party' && (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Sequins and sparkles are perfect for parties</p>
                  <p>• Bold colors help you stand out in photos</p>
                  <p>• Comfortable heels = dancing all night long</p>
                </div>
              )}
              {categoryType === 'work' && (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Classic pieces never go out of style</p>
                  <p>• Neutral colors are professional and versatile</p>
                  <p>• Comfort is key for long work days</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Floating Back Button */}
      <Button 
        className="floating-btn fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl hover:bg-primary/90 transition-all shadow-lg z-50"
        onClick={() => window.location.href = "/"}
        data-testid="button-floating-back"
      >
        ↩️
      </Button>
    </div>
  );
}