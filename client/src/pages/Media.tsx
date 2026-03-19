import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Heart, Share2, MessageSquare, ArrowLeft, Send, Bookmark, BookmarkCheck } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { sounds, initAudio } from "@/lib/sounds";
import type { Item } from "@shared/schema";

export default function Media({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return isAuthenticated ? <AuthenticatedMediaFeed /> : <TrialMediaFeed />;
}

// Trial users see full-screen TikTok experience
function TrialMediaFeed() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [hasSeenPrompt, setHasSeenPrompt] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    initAudio();
  }, []);
  
  // Fetch public outfits with infinite pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["/api/public/items"],
    queryFn: async ({ pageParam = undefined }) => {
      const params = new URLSearchParams({
        limit: "10",
        ...(pageParam && { cursor: pageParam as string }),
      });
      
      const response = await fetch(`/api/public/items?${params}`);
      if (!response.ok) throw new Error('Failed to fetch public outfits');
      return response.json();
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Flatten all outfit pages into single array
  const allOutfits = data?.pages.flatMap((page: any) => page.items) || [];

  // Handle scroll and active slide detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setActiveIndex(index);
            
            // Show signup prompt after viewing 6 items
            if (index >= 5 && !hasSeenPrompt) {
              setShowSignupPrompt(true);
              setHasSeenPrompt(true);
            }
            
            // Prefetch next page when approaching the end
            if (index >= allOutfits.length - 2 && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }
        });
      },
      { 
        threshold: 0.5,
        rootMargin: '0px'
      }
    );

    // Observe all slides
    const slides = container.querySelectorAll('[data-index]');
    slides.forEach(slide => observer.observe(slide));

    return () => observer.disconnect();
  }, [allOutfits.length, hasNextPage, isFetchingNextPage, fetchNextPage, hasSeenPrompt]);

  // Preload images for better performance
  useEffect(() => {
    if (allOutfits.length > activeIndex + 1) {
      const nextOutfit = allOutfits[activeIndex + 1];
      if (nextOutfit?.photoURL) {
        const img = new Image();
        img.src = nextOutfit.photoURL;
      }
    }
  }, [activeIndex, allOutfits]);

  const handleLike = (outfitId: string) => {
    if (likedItems.has(outfitId)) {
      likedItems.delete(outfitId);
      setLikedItems(new Set(likedItems));
      sounds.unlike();
    } else {
      likedItems.add(outfitId);
      setLikedItems(new Set(likedItems));
      sounds.like();
    }
  };

  const handleSave = (outfitId: string) => {
    if (savedItems.has(outfitId)) {
      savedItems.delete(outfitId);
      setSavedItems(new Set(savedItems));
      sounds.pop();
    } else {
      savedItems.add(outfitId);
      setSavedItems(new Set(savedItems));
      sounds.success();
      toast({ title: "Saved!", description: "Added to your collection" });
    }
  };

  const handleShare = (outfit: any) => {
    sounds.share();
    const shareUrl = `${window.location.origin}/demo`;
    const shareText = `Check out this outfit: ${outfit.title || 'Stylish look'} on Closet Memories!`;
    
    if (navigator.share) {
      navigator.share({
        title: outfit.title || "Check out this outfit!",
        text: shareText,
        url: shareUrl
      }).catch(() => {
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied!", description: "Share with your friends" });
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!", description: "Share with your friends" });
    }
  };

  const handleComment = () => {
    sounds.comment();
    setShowSignupPrompt(true);
  };

  const handleBack = () => {
    sounds.click();
    setLocation("/demo");
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-black flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-white rounded-full"></div>
          <div className="absolute inset-0 animate-ping w-12 h-12 border-4 border-white/10 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-black overflow-hidden relative">
      {/* Header with back button - TikTok style */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
        <div className="flex items-center justify-between px-4 py-5" style={{ paddingTop: "env(safe-area-inset-top, 20px)" }}>
          <button
            onClick={handleBack}
            className="w-10 h-10 backdrop-blur-md bg-white/10 rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center space-x-2.5 backdrop-blur-md bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-2xl">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7L12 3L4 7V17L12 21L20 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 12L20 7L12 3L4 7L12 12Z" fill="currentColor" opacity="0.3"/>
                <path d="M12 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-base font-bold text-white drop-shadow-2xl tracking-tight">Feed</h1>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Vertical scrolling feed */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ 
          scrollSnapType: "y mandatory",
          overscrollBehaviorY: "contain"
        }}
      >
        {allOutfits.map((outfit, index) => (
          <div
            key={outfit.id}
            data-index={index}
            className="h-[100dvh] min-h-[100dvh] relative flex items-center justify-center snap-start snap-always"
            style={{ willChange: "transform" }}
          >
            {/* Background media (image or video) */}
            <div className="absolute inset-0">
              {outfit.mediaType === "video" ? (
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(index, el);
                  }}
                  src={outfit.photoURL}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  style={{
                    filter: "brightness(0.8)",
                  }}
                  data-testid={`video-${outfit.id}`}
                />
              ) : (
                <img
                  src={outfit.photoURL}
                  alt={outfit.title || "Outfit"}
                  className="w-full h-full object-cover"
                  loading={index <= activeIndex + 1 ? "eager" : "lazy"}
                  style={{
                    filter: "brightness(0.8)",
                  }}
                />
              )}
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60"></div>
            </div>

            {/* Content overlays */}
            {/* Bottom left: Outfit metadata */}
            <div className="absolute bottom-20 left-4 right-24 z-40" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
              <h3 className="text-white text-3xl font-extrabold mb-3 drop-shadow-2xl tracking-tight">
                {outfit.title || "Stylish Outfit"}
              </h3>
              {outfit.memoryNote && (
                <p className="text-white/95 text-base mb-4 drop-shadow-lg font-medium leading-relaxed">
                  {outfit.memoryNote}
                </p>
              )}
              
              {/* Clothing Links */}
              {outfit.clothingLinks && outfit.clothingLinks.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-white/70 text-sm font-medium mb-2">Shop the look:</p>
                  {outfit.clothingLinks.map((link: any, linkIndex: number) => (
                    <a
                      key={linkIndex}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white text-sm font-semibold rounded-lg border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-200"
                      data-testid={`clothing-link-${linkIndex}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span className="flex-1">{link.name}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              )}

              {outfit.tags && outfit.tags.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                  {outfit.tags.map((tag: string, tagIndex: number) => (
                    <span 
                      key={tagIndex}
                      className="px-4 py-1.5 bg-white/15 backdrop-blur-md text-white text-sm font-semibold rounded-full border border-white/20 shadow-lg hover:bg-white/25 transition-all duration-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right side: Action buttons */}
            <div className="absolute bottom-32 right-5 z-40 flex flex-col space-y-4" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
              {/* Sound toggle for videos */}
              {outfit.mediaType === "video" && (
                <button
                  onClick={() => { setIsMuted(!isMuted); sounds.click(); }}
                  className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 hover:scale-110 active:scale-95 transition-all duration-200 shadow-2xl"
                  data-testid="button-sound-toggle"
                >
                  {isMuted ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
              )}
              
              {/* Like Button */}
              <button
                onClick={() => handleLike(outfit.id)}
                className={`w-14 h-14 backdrop-blur-xl rounded-full flex flex-col items-center justify-center border border-white/20 hover:scale-110 active:scale-95 transition-all duration-200 shadow-2xl ${
                  likedItems.has(outfit.id) ? 'bg-red-500/80 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                data-testid="button-like"
              >
                <Heart className={`w-6 h-6 ${likedItems.has(outfit.id) ? 'fill-white' : ''}`} />
              </button>
              
              {/* Comment Button */}
              <button
                onClick={handleComment}
                className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 hover:scale-110 active:scale-95 transition-all duration-200 shadow-2xl"
                data-testid="button-comment"
              >
                <MessageSquare className="w-6 h-6 text-white" />
              </button>
              
              {/* Save Button */}
              <button
                onClick={() => handleSave(outfit.id)}
                className={`w-14 h-14 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 hover:scale-110 active:scale-95 transition-all duration-200 shadow-2xl ${
                  savedItems.has(outfit.id) ? 'bg-primary/80 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                data-testid="button-save"
              >
                {savedItems.has(outfit.id) ? (
                  <BookmarkCheck className="w-6 h-6 fill-white" />
                ) : (
                  <Bookmark className="w-6 h-6" />
                )}
              </button>
              
              {/* Share Button */}
              <button
                onClick={() => handleShare(outfit)}
                className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 hover:scale-110 active:scale-95 transition-all duration-200 shadow-2xl"
                data-testid="button-share"
              >
                <Share2 className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        ))}

        {/* Loading indicator for pagination */}
        {isFetchingNextPage && (
          <div className="h-[100dvh] flex items-center justify-center snap-start bg-black">
            <div className="relative">
              <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-white rounded-full"></div>
              <div className="absolute inset-0 animate-ping w-12 h-12 border-4 border-white/10 rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* Signup Dialog */}
      <Dialog open={showSignupPrompt} onOpenChange={setShowSignupPrompt}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-2xl border-white/10 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-extrabold text-center bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-2">
              Sign up to continue
            </DialogTitle>
            <DialogDescription className="text-center text-base text-white/70 font-medium leading-relaxed">
              Create your free account to upload outfits, share with friends, and get personalized style suggestions!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 pt-6">
            <div className="grid grid-cols-3 gap-5 text-center">
              <div className="space-y-2">
                <div className="text-3xl">📷</div>
                <div className="text-sm text-white/80 font-medium">Upload outfits</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl">👥</div>
                <div className="text-sm text-white/80 font-medium">Share with friends</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl">🤖</div>
                <div className="text-sm text-white/80 font-medium">AI suggestions</div>
              </div>
            </div>
            
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="w-full bg-white text-black hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98] py-6 text-base font-bold transition-all duration-200 shadow-xl"
              data-testid="button-signup-modal"
            >
              Sign up for free
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setShowSignupPrompt(false)}
              className="w-full text-white/70 hover:text-white hover:bg-white/5 font-medium transition-all duration-200"
              data-testid="button-continue-browsing"
            >
              Keep browsing
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSS for hiding scrollbars */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// Authenticated users see TikTok feed with sidebar layout
function AuthenticatedMediaFeed() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeOutfit, setActiveOutfit] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    initAudio();
  }, []);

  const handleLike = (outfitId: string) => {
    if (likedItems.has(outfitId)) {
      likedItems.delete(outfitId);
      setLikedItems(new Set(likedItems));
      sounds.unlike();
    } else {
      likedItems.add(outfitId);
      setLikedItems(new Set(likedItems));
      sounds.like();
    }
  };

  const handleSave = (outfitId: string) => {
    if (savedItems.has(outfitId)) {
      savedItems.delete(outfitId);
      setSavedItems(new Set(savedItems));
      sounds.pop();
    } else {
      savedItems.add(outfitId);
      setSavedItems(new Set(savedItems));
      sounds.success();
      toast({ title: "Saved!", description: "Added to your collection" });
    }
  };

  const handleShare = (outfit: any) => {
    sounds.share();
    const shareUrl = `${window.location.origin}/media`;
    const shareText = `Check out this outfit: ${outfit.title || 'Stylish look'} on Closet Memories!`;
    
    if (navigator.share) {
      navigator.share({
        title: outfit.title || "Check out this outfit!",
        text: shareText,
        url: shareUrl
      }).catch(() => {
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied!", description: "Share with your friends" });
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!", description: "Share with your friends" });
    }
  };

  const handleComment = (outfit: any) => {
    sounds.comment();
    setActiveOutfit(outfit);
    setShowCommentModal(true);
  };

  const submitComment = () => {
    if (commentText.trim()) {
      sounds.success();
      toast({ title: "Comment posted!", description: "Your comment is now visible" });
      setCommentText("");
      setShowCommentModal(false);
    }
  };

  const handleBack = () => {
    sounds.click();
    setLocation("/");
  };
  
  // Fetch public outfits with infinite pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["/api/public/items"],
    queryFn: async ({ pageParam = undefined }) => {
      const params = new URLSearchParams({
        limit: "10",
        ...(pageParam && { cursor: pageParam as string }),
      });
      
      const response = await fetch(`/api/public/items?${params}`);
      if (!response.ok) throw new Error('Failed to fetch public outfits');
      return response.json();
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Flatten all outfit pages into single array
  const allOutfits = data?.pages.flatMap((page: any) => page.items) || [];

  // Handle scroll and active slide detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setActiveIndex(index);
            
            // Prefetch next page when approaching the end
            if (index >= allOutfits.length - 2 && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }
        });
      },
      { 
        threshold: 0.5,
        rootMargin: '0px'
      }
    );

    // Observe all slides
    const slides = container.querySelectorAll('[data-index]');
    slides.forEach(slide => observer.observe(slide));

    return () => observer.disconnect();
  }, [allOutfits.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Preload images for better performance
  useEffect(() => {
    if (allOutfits.length > activeIndex + 1) {
      const nextOutfit = allOutfits[activeIndex + 1];
      if (nextOutfit?.photoURL) {
        const img = new Image();
        img.src = nextOutfit.photoURL;
      }
    }
  }, [activeIndex, allOutfits]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg relative z-10 bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg relative z-10 bg-background">
      {/* Desktop Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border glass-effect hidden md:flex flex-col z-30">
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7L12 3L4 7V17L12 21L20 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 12L20 7L12 3L4 7L12 12Z" fill="currentColor" opacity="0.3"/>
                <path d="M12 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-foreground">Closet Memories</h1>
          </div>
        </div>
        
        <div className="flex-1 p-4 space-y-2">
          <a href="/" className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" data-testid="sidebar-home">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </a>
          
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" data-testid="sidebar-closet">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Closet</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium" data-testid="sidebar-feed">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Feed</span>
          </button>
          
          <a href="/friends" className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" data-testid="sidebar-friends">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Friends</span>
          </a>
          
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" data-testid="sidebar-polls">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>Polls</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" data-testid="sidebar-profile">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Profile</span>
          </button>
        </div>
      </nav>

      {/* Header with back button */}
      <header className="glass-effect sticky top-0 z-40 border-b border-border md:ml-64" data-testid="header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-muted rounded-xl transition-colors md:hidden"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-sm md:hidden">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 7L12 3L4 7V17L12 21L20 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 12L20 7L12 3L4 7L12 12Z" fill="currentColor" opacity="0.3"/>
                  <path d="M12 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold text-foreground md:hidden">Closet Memories</h1>
            </div>
            <div className="hidden md:block">
              <h2 className="text-xl font-bold text-foreground">Feed</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-muted rounded-lg transition-colors" data-testid="button-search">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with TikTok-style feed */}
      <main className="md:ml-64 h-[calc(100vh-80px)]">
        <div 
          ref={containerRef}
          className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide bg-black"
          style={{ 
            scrollSnapType: "y mandatory",
            overscrollBehaviorY: "contain"
          }}
        >
          {allOutfits.map((outfit, index) => (
            <div
              key={outfit.id}
              data-index={index}
              className="h-full min-h-full relative flex items-center justify-center snap-start snap-always"
              style={{ willChange: "transform" }}
            >
              {/* Background media (image or video) */}
              <div className="absolute inset-0">
                {outfit.mediaType === "video" ? (
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(index, el);
                    }}
                    src={outfit.photoURL}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    style={{
                      filter: "brightness(0.8)",
                    }}
                    data-testid={`video-${outfit.id}`}
                  />
                ) : (
                  <img
                    src={outfit.photoURL}
                    alt={outfit.title || "Outfit"}
                    className="w-full h-full object-cover"
                    loading={index <= activeIndex + 1 ? "eager" : "lazy"}
                    style={{
                      filter: "brightness(0.8)",
                    }}
                  />
                )}
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60"></div>
              </div>

              {/* Content overlays */}
              {/* Bottom left: Outfit metadata */}
              <div className="absolute bottom-20 left-4 right-20 z-40">
                <h3 className="text-white text-2xl font-bold mb-2 drop-shadow-lg">
                  {outfit.title || "Stylish Outfit"}
                </h3>
                {outfit.memoryNote && (
                  <p className="text-white/90 text-base mb-3 drop-shadow-lg">
                    {outfit.memoryNote}
                  </p>
                )}
                
                {/* Clothing Links */}
                {outfit.clothingLinks && outfit.clothingLinks.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <p className="text-white/70 text-sm font-medium mb-2">Shop the look:</p>
                    {outfit.clothingLinks.map((link: any, linkIndex: number) => (
                      <a
                        key={linkIndex}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-lg border border-white/30 hover:bg-white/30 transition-colors"
                        data-testid={`clothing-link-${linkIndex}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span className="flex-1">{link.name}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                )}

                {outfit.tags && outfit.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {outfit.tags.map((tag: string, tagIndex: number) => (
                      <span 
                        key={tagIndex}
                        className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full border border-white/30"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right side: Action buttons */}
              <div className="absolute bottom-32 right-4 z-40 flex flex-col space-y-4">
                {/* Sound toggle for videos */}
                {outfit.mediaType === "video" && (
                  <button
                    onClick={() => { setIsMuted(!isMuted); sounds.click(); }}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 hover:scale-110 active:scale-95 transition-all"
                    data-testid="button-sound-toggle"
                  >
                    {isMuted ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    )}
                  </button>
                )}
                
                {/* Like Button */}
                <button
                  onClick={() => handleLike(outfit.id)}
                  className={`w-12 h-12 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:scale-110 active:scale-95 transition-all ${
                    likedItems.has(outfit.id) ? 'bg-red-500/80' : 'bg-white/20 hover:bg-white/30'
                  }`}
                  data-testid="button-like"
                >
                  <Heart className={`w-6 h-6 text-white ${likedItems.has(outfit.id) ? 'fill-white' : ''}`} />
                </button>
                
                {/* Comment Button */}
                <button
                  onClick={() => handleComment(outfit)}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 hover:scale-110 active:scale-95 transition-all"
                  data-testid="button-comment"
                >
                  <MessageSquare className="w-6 h-6 text-white" />
                </button>
                
                {/* Save Button */}
                <button
                  onClick={() => handleSave(outfit.id)}
                  className={`w-12 h-12 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:scale-110 active:scale-95 transition-all ${
                    savedItems.has(outfit.id) ? 'bg-primary/80' : 'bg-white/20 hover:bg-white/30'
                  }`}
                  data-testid="button-save"
                >
                  {savedItems.has(outfit.id) ? (
                    <BookmarkCheck className="w-6 h-6 text-white fill-white" />
                  ) : (
                    <Bookmark className="w-6 h-6 text-white" />
                  )}
                </button>
                
                {/* Share Button */}
                <button
                  onClick={() => handleShare(outfit)}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 hover:scale-110 active:scale-95 transition-all"
                  data-testid="button-share"
                >
                  <Share2 className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          ))}

          {/* Loading indicator for pagination */}
          {isFetchingNextPage && (
            <div className="h-full flex items-center justify-center snap-start bg-black">
              <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Post Button */}
      <a
        href="/"
        className="fixed bottom-24 md:bottom-8 right-6 md:right-8 z-50 w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform"
        data-testid="button-post-to-feed"
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </a>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border glass-effect md:hidden">
        <div className="flex justify-around py-3">
          <a href="/" className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground" data-testid="nav-home">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </a>
          <button className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground" data-testid="nav-closet">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="text-xs font-medium">Closet</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-primary" data-testid="nav-feed">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">Feed</span>
          </button>
          <a href="/friends" className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground" data-testid="nav-friends">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs font-medium">Friends</span>
          </a>
          <button className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground" data-testid="nav-polls">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-xs font-medium">Polls</span>
          </button>
        </div>
      </nav>

      {/* Comment Modal */}
      <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Comments
            </DialogTitle>
            <DialogDescription>
              {activeOutfit?.title || "This outfit"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Sample comments */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              <div className="flex gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold">S</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">StyleGuru</div>
                  <div className="text-sm text-muted-foreground">Love this look! Where did you get the jacket?</div>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center text-sm font-bold">F</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">FashionFan</div>
                  <div className="text-sm text-muted-foreground">This is giving main character energy!</div>
                </div>
              </div>
            </div>
            
            {/* Comment input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                data-testid="input-comment"
              />
              <Button 
                onClick={submitComment} 
                size="icon" 
                className="rounded-xl"
                disabled={!commentText.trim()}
                data-testid="button-submit-comment"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSS for hiding scrollbars */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}