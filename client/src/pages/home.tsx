import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";
import { VideoRecorder } from "@/components/VideoRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useTrial } from "@/contexts/TrialContext";
import { Home as HomeIcon, Shirt, PlaySquare, Users, BarChart3, User, Sparkles, Zap, Search, Plus, LogOut, Heart, MoreHorizontal, FolderInput, Check, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Item, Poll, ItemCategory } from "@shared/schema";
import { ITEM_CATEGORIES } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

interface OutfitSuggestion {
  title: string;
  description: string;
  suggestions: Array<{
    option: number;
    itemIds: string[];
    items: Array<{
      id: string;
      photoURL: string;
      title: string | null;
      memoryNote: string | null;
      tags: string[] | null;
    }>;
    description: string;
    reasoning: string;
  }>;
  nudges?: string[]; // Suggestions to complete the wardrobe
}

type TabType = "home" | "closet" | "polls" | "profile";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [showUpload, setShowUpload] = useState(false);
  const [showMemoryNote, setShowMemoryNote] = useState(false);
  const [memoryNote, setMemoryNote] = useState("");
  const [uploadedPhotoURL, setUploadedPhotoURL] = useState("");
  const [showPollModal, setShowPollModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [pollTitle, setPollTitle] = useState("");
  const [outfitSuggestion, setOutfitSuggestion] = useState<OutfitSuggestion | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedPoll, setSharedPoll] = useState<Poll | null>(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [clothingLinks, setClothingLinks] = useState<Array<{ name: string; url: string; timestamp?: number }>>([]);
  const [postToFeed, setPostToFeed] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | ItemCategory>("ALL");
  const [showMoveSheet, setShowMoveSheet] = useState(false);
  const [itemToMove, setItemToMove] = useState<string | null>(null);
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [bulkSelectedItems, setBulkSelectedItems] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { isTrialMode, checkInteraction } = useTrial();

  const userId = (user as any)?.id || "demo-user";

  // Fetch user's items (demo data for trial, real data for authenticated)
  const { data: items = [], isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: isTrialMode ? ["/api/demo/items"] : ["/api/items"],
    queryFn: async () => {
      const endpoint = isTrialMode ? "/api/demo/items" : `/api/items?userId=${userId}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json();
    }
  });

  // Fetch user's polls (demo polls for trial users)
  const { data: polls = [] } = useQuery<Poll[]>({
    queryKey: isTrialMode ? ["/api/demo/polls"] : ["/api/polls"],
    queryFn: async () => {
      const endpoint = isTrialMode ? "/api/demo/polls" : `/api/polls?userId=${userId}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch polls');
      return response.json();
    }
  });

  // Fetch friends for sharing (empty for trial users)
  const { data: friends = [] } = useQuery({
    queryKey: ["/api/friends", userId],
    queryFn: async () => {
      if (isTrialMode) return []; // No friends for trial users
      const response = await fetch(`/api/friends?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch friends');
      return response.json();
    },
    enabled: !isTrialMode
  });

  // Filter items by category (client-side for instant switching)
  const filteredItems = useMemo(() => {
    if (categoryFilter === "ALL") return items;
    return items.filter(item => (item as any).category === categoryFilter);
  }, [items, categoryFilter]);

  // Category tab configuration with labels and icons
  const categoryTabs = [
    { id: "ALL" as const, label: "All", icon: "✨" },
    { id: "TOPS" as const, label: "Tops", icon: "👕" },
    { id: "BOTTOMS" as const, label: "Bottoms", icon: "👖" },
    { id: "DRESSES" as const, label: "Dresses", icon: "👗" },
    { id: "SHOES" as const, label: "Shoes", icon: "👟" },
    { id: "ACCESSORIES" as const, label: "Accessories", icon: "👜" },
  ];

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: { photoURL: string; memoryNote?: string; userId: string; mediaType?: string; clothingLinks?: Array<{name: string; url: string; timestamp?: number}>; visibility?: string }) => {
      const response = await apiRequest("POST", "/api/items", itemData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setShowUpload(false);
      setShowMemoryNote(false);
      setMemoryNote("");
      setUploadedPhotoURL("");
      setClothingLinks([]);
      setPostToFeed(false);
      toast({
        title: postToFeed ? "Posted to Feed! 🎉" : "Outfit saved! ✨",
        description: postToFeed ? "Your outfit is now live on the public feed!" : "Your fit has been added to your closet."
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving outfit",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Create poll mutation
  const createPollMutation = useMutation({
    mutationFn: async (pollData: { title: string; itemIds: string[]; userId: string }) => {
      const response = await apiRequest("POST", "/api/polls", pollData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      setShowPollModal(false);
      setSelectedItems([]);
      setPollTitle("");
      setIsSelectMode(false);
      setSharedPoll(data);
      setShowShareModal(true);
    },
    onError: (error) => {
      toast({
        title: "Error creating poll",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Get outfit suggestion mutation
  const getOutfitSuggestionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/suggest-outfit", { userId });
      return response.json();
    },
    onSuccess: (data) => {
      setOutfitSuggestion(data);
      setShowSuggestionModal(true);
    },
    onError: (error) => {
      toast({
        title: "Error getting suggestion",
        description: "Could not generate outfit suggestion. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest("DELETE", `/api/items/${itemId}?userId=${userId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Outfit deleted! 🗑️",
        description: "Your outfit has been removed from your closet."
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting outfit",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Move item to different category
  const moveItemMutation = useMutation({
    mutationFn: async ({ itemId, category }: { itemId: string; category: ItemCategory }) => {
      const response = await apiRequest("PATCH", `/api/items/${itemId}`, { category });
      return response.json();
    },
    onSuccess: (_, { category }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setShowMoveSheet(false);
      setItemToMove(null);
      toast({
        title: "Item moved! 📦",
        description: `Moved to ${categoryTabs.find(t => t.id === category)?.label || category}.`
      });
    },
    onError: () => {
      toast({
        title: "Error moving item",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Bulk move items
  const bulkMoveItemsMutation = useMutation({
    mutationFn: async ({ itemIds, category }: { itemIds: string[]; category: ItemCategory }) => {
      const response = await apiRequest("PATCH", "/api/items/bulk/category", { itemIds, category });
      return response.json();
    },
    onSuccess: (data, { category }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setShowMoveSheet(false);
      setBulkSelectedItems([]);
      setIsBulkSelectMode(false);
      toast({
        title: "Items moved! 📦",
        description: `Moved ${data.updated} items to ${categoryTabs.find(t => t.id === category)?.label || category}.`
      });
    },
    onError: () => {
      toast({
        title: "Error moving items",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", { method: "POST" });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]) {
      const photoURL = result.successful[0].uploadURL as string;
      // Redirect to tagging page with encoded photo URL
      setLocation(`/tag-outfit/${encodeURIComponent(photoURL)}`);
    }
  };

  const handleSaveOutfit = () => {
    if (!uploadedPhotoURL) return;
    
    createItemMutation.mutate({
      photoURL: uploadedPhotoURL,
      memoryNote: memoryNote.trim() || undefined,
      userId,
      visibility: postToFeed ? "public" : "private"
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // This would trigger the upload process
      setShowMemoryNote(true);
    }
  };

  const handleVideoRecorded = async (videoBlob: Blob, links: Array<{ name: string; url: string; timestamp?: number }>) => {
    try {
      // Get upload URL
      const response = await fetch("/api/objects/upload", { method: "POST" });
      const data = await response.json();
      
      // Upload video to object storage
      const uploadResponse = await fetch(data.uploadURL, {
        method: "PUT",
        body: videoBlob,
        headers: {
          'Content-Type': 'video/webm'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }

      // Create item with video and clothing links
      createItemMutation.mutate({
        photoURL: data.uploadURL,
        userId,
        mediaType: "video",
        clothingLinks: links,
        memoryNote: memoryNote.trim() || undefined
      });

      setShowVideoRecorder(false);
      setClothingLinks([]);
      setMemoryNote("");
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Error uploading video",
        description: "Failed to upload your video. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleItemSelect = (itemId: string) => {
    if (!isSelectMode) return;
    
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else if (selectedItems.length < 3) {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleCreatePoll = () => {
    if (selectedItems.length < 2) {
      toast({
        title: "Select at least 2 outfits",
        description: "You need to select 2-3 outfits to create a poll.",
        variant: "destructive"
      });
      return;
    }
    
    if (!pollTitle.trim()) {
      toast({
        title: "Add a poll title",
        description: "Give your poll a fun title!",
        variant: "destructive"
      });
      return;
    }
    
    if (isTrialMode) {
      toast({
        title: "Sign in to create polls! 🔐",
        description: "Create an account to make polls and share them with friends!",
      });
      cancelSelectMode();
      return;
    }
    
    createPollMutation.mutate({
      title: pollTitle,
      itemIds: selectedItems,
      userId
    });
  };

  const startSelectMode = () => {
    // In demo mode, show a toast that polls are view-only, but still allow interaction
    if (isTrialMode) {
      toast({
        title: "Demo Mode",
        description: "You're in demo mode! In the full version, you can create and share polls with friends.",
      });
    }
    setIsSelectMode(true);
    setShowPollModal(true);
  };

  const cancelSelectMode = () => {
    setIsSelectMode(false);
    setSelectedItems([]);
    setShowPollModal(false);
    setPollTitle("");
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const copyPollLink = async (shareLink: string) => {
    const pollUrl = `${window.location.origin}/poll/${shareLink}`;
    try {
      await navigator.clipboard.writeText(pollUrl);
      toast({
        title: "Link copied! 🎉",
        description: "Poll link has been copied to your clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy link. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteItem = (itemId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click when delete button is clicked
    deleteItemMutation.mutate(itemId);
  };

  return (
    <div className="min-h-screen gradient-bg relative z-10 bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl sticky top-0 z-40 border-b border-border/50 md:ml-64" data-testid="header">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:hidden">
              <div className="w-10 h-10 gradient-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gradient">Closet Memories</span>
            </div>
            <div className="hidden md:block">
              <h2 className="text-2xl font-bold text-foreground capitalize">{activeTab}</h2>
            </div>
            <div className="flex items-center space-x-1">
              <button className="p-2.5 hover:bg-muted rounded-xl transition-all" data-testid="button-search">
                <Search className="w-5 h-5 text-muted-foreground" />
              </button>
              <button 
                onClick={() => setActiveTab("profile")}
                className="p-2.5 hover:bg-muted rounded-xl transition-all" 
                data-testid="button-profile"
              >
                <User className="w-5 h-5 text-muted-foreground" />
              </button>
              {isTrialMode ? (
                <Button 
                  onClick={() => window.location.href = "/api/login"}
                  className="gradient-accent text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-primary/20 hover:shadow-xl transition-all ml-1"
                  data-testid="button-sign-in"
                >
                  Sign In
                </Button>
              ) : (
                <button 
                  onClick={() => window.location.href = "/api/logout"}
                  className="p-2.5 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all" 
                  data-testid="button-logout"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 md:ml-64">
        
        {/* HOME TAB - Welcome Section */}
        {activeTab === "home" && (
          <section className="mb-8 page-transition">
            <Card className="bg-gradient-to-br from-card to-primary/5 rounded-3xl border-border/50 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 gradient-accent rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Hey gorgeous!</h2>
                    <p className="text-muted-foreground">Ready to capture your style moments?</p>
                  </div>
                </div>
              
              <Button 
                className="w-full gradient-accent text-white py-4 px-6 rounded-2xl font-semibold mb-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                onClick={() => {
                  if (isTrialMode) {
                    // Show demo AI suggestion with actual demo images
                    setOutfitSuggestion({
                      title: "Today's Outfit Suggestion ✨",
                      description: "Based on your closet and today's weather, here are my top picks for you!",
                      suggestions: [
                        {
                          option: 1,
                          itemIds: ["demo-1", "demo-4"],
                          items: [
                            { id: "demo-1", photoURL: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800", title: "Cozy Winter Sweater", memoryNote: "Perfect for chilly days", tags: ["winter", "cozy"] },
                            { id: "demo-4", photoURL: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800", title: "Street Style Vibes", memoryNote: "Downtown shopping day", tags: ["streetwear", "casual"] }
                          ],
                          description: "Cozy & Trendy Combo",
                          reasoning: "Mix that warm sweater with street style vibes for a comfy yet fashionable look! 🔥"
                        },
                        {
                          option: 2,
                          itemIds: ["demo-3", "demo-5"],
                          items: [
                            { id: "demo-3", photoURL: "https://images.unsplash.com/photo-1551048632-dae6bb2ba579?w=800", title: "Business Casual", memoryNote: "First day at new job", tags: ["business", "professional"] },
                            { id: "demo-5", photoURL: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800", title: "Elegant Evening Look", memoryNote: "Dinner with friends", tags: ["elegant", "evening"] }
                          ],
                          description: "Professional & Polished",
                          reasoning: "Perfect for a day that goes from work to dinner! You'll look amazing! 💼✨"
                        }
                      ]
                    });
                    setShowSuggestionModal(true);
                  } else {
                    getOutfitSuggestionMutation.mutate();
                  }
                }}
                disabled={getOutfitSuggestionMutation.isPending}
                data-testid="button-suggest-outfit"
              >
                {getOutfitSuggestionMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Getting suggestion...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Suggest my outfit today
                  </div>
                )}
              </Button>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gradient-to-br from-violet-100 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/20 rounded-2xl p-4 border border-violet-200/50 dark:border-violet-700/30">
                  <div className="text-2xl font-bold text-gradient" data-testid="text-total-outfits">{items.length}</div>
                  <div className="text-sm text-muted-foreground">Outfits</div>
                </div>
                <div className="bg-gradient-to-br from-rose-100 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/20 rounded-2xl p-4 border border-rose-200/50 dark:border-rose-700/30">
                  <div className="text-2xl font-bold text-secondary" data-testid="text-total-polls">{polls.length}</div>
                  <div className="text-sm text-muted-foreground">Polls</div>
                </div>
                <div className="bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-700/30">
                  <div className="text-2xl font-bold text-foreground" data-testid="text-total-votes">156</div>
                  <div className="text-sm text-muted-foreground">Votes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        )}

        {/* Upload Section - shown on home or closet tab */}
        {showUpload && (
          <section className="mb-8" data-testid="section-upload">
            <Card className="bg-card rounded-2xl border-border">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Add a new fit!
                </h3>
                
                <div className="space-y-4">
                  {/* Camera and File Upload Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Take Photo Button */}
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      enableCamera={true}
                      buttonClassName="w-full h-32 border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all rounded-xl"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="text-center">
                          <div className="font-medium">Take Photo</div>
                          <div className="text-sm text-muted-foreground">Use your camera</div>
                        </div>
                      </div>
                    </ObjectUploader>

                    {/* Upload from Files Button */}
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      enableCamera={false}
                      buttonClassName="w-full h-32 border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all rounded-xl"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div className="text-center">
                          <div className="font-medium">Upload from Files</div>
                          <div className="text-sm text-muted-foreground">Choose from gallery</div>
                        </div>
                      </div>
                    </ObjectUploader>

                    {/* Record Video Button */}
                    <Button
                      onClick={() => {
                        setShowUpload(false);
                        setShowVideoRecorder(true);
                      }}
                      variant="outline"
                      className="w-full h-32 border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all rounded-xl"
                      data-testid="button-record-video"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <div className="text-center">
                          <div className="font-medium">Record Video</div>
                          <div className="text-sm text-muted-foreground">Tag clothing items</div>
                        </div>
                      </div>
                    </Button>
                  </div>

                  {/* Mobile Camera Fallback */}
                  <div className="md:hidden">
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*"
                      capture="environment"
                      className="hidden" 
                      onChange={handleFileSelect}
                      data-testid="input-camera-capture"
                    />
                  </div>
                </div>
                
                {showMemoryNote && (
                  <div className="space-y-4" data-testid="section-memory-note">
                    <div>
                      <Label className="block text-sm font-medium mb-2">What's special about this outfit? ✨</Label>
                      <Textarea 
                        value={memoryNote}
                        onChange={(e) => setMemoryNote(e.target.value)}
                        rows={3} 
                        placeholder="Going to Sarah's party tonight! Feeling cute 💖"
                        className="resize-none"
                        data-testid="textarea-memory-note"
                      />
                    </div>
                    
                    {/* Post to Feed Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-sm">Post to Feed</div>
                          <div className="text-xs text-muted-foreground">Share with everyone on the public feed</div>
                        </div>
                      </div>
                      <Switch
                        checked={postToFeed}
                        onCheckedChange={setPostToFeed}
                        data-testid="switch-post-to-feed"
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleSaveOutfit}
                        disabled={createItemMutation.isPending}
                        data-testid="button-save-outfit"
                      >
                        {createItemMutation.isPending ? "Saving..." : "Save to Closet 💫"}
                      </Button>
                      <Button 
                        variant="secondary"
                        onClick={() => {
                          setShowUpload(false);
                          setShowMemoryNote(false);
                          setMemoryNote("");
                          setUploadedPhotoURL("");
                          setPostToFeed(false);
                        }}
                        data-testid="button-cancel-upload"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* CLOSET TAB - Filter Tabs and Outfit Gallery */}
        {(activeTab === "home" || activeTab === "closet") && (
        <>
        {/* Closet Header */}
        <section className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shirt className="w-6 h-6 text-primary" />
              Your Closet
            </h2>
            <div className="flex gap-2">
              {!isBulkSelectMode ? (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => setIsBulkSelectMode(true)}
                    className="rounded-xl"
                    data-testid="button-select-mode"
                  >
                    Select
                  </Button>
                  <Button 
                    onClick={() => setShowUpload(true)}
                    className="gradient-accent text-white rounded-xl shadow-md"
                    data-testid="button-add-item"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsBulkSelectMode(false);
                      setBulkSelectedItems([]);
                    }}
                    className="rounded-xl"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => setShowMoveSheet(true)}
                    disabled={bulkSelectedItems.length === 0}
                    className="gradient-accent text-white rounded-xl shadow-md"
                    data-testid="button-bulk-move"
                  >
                    <FolderInput className="w-4 h-4 mr-2" />
                    Move ({bulkSelectedItems.length})
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Category Tabs - Sticky */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 border-b border-border/30">
            <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-150 ${
                    categoryFilter === tab.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  data-testid={`tab-${tab.id.toLowerCase()}`}
                >
                  {tab.label} {tab.icon}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Outfit Gallery */}
        <section className="mb-8">
          
          {itemsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm">
                  <div className="w-full h-52 shimmer"></div>
                  <div className="p-4">
                    <div className="h-4 shimmer rounded-lg mb-3"></div>
                    <div className="h-3 shimmer rounded-lg w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <Card className="bg-gradient-to-br from-card to-primary/5 rounded-3xl border-border/50 shadow-lg">
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 mx-auto mb-6 gradient-accent rounded-3xl flex items-center justify-center shadow-lg text-4xl">
                  {categoryFilter === "ALL" ? "👕" : categoryTabs.find(t => t.id === categoryFilter)?.icon || "👕"}
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {categoryFilter === "ALL" 
                    ? "Your closet is empty" 
                    : `No ${categoryTabs.find(t => t.id === categoryFilter)?.label.toLowerCase()} yet`}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {categoryFilter === "ALL" 
                    ? "Upload your first outfit to get started!" 
                    : "Add photos to start building this category."}
                </p>
                <Button 
                  onClick={() => setShowUpload(true)} 
                  className="gradient-accent text-white rounded-2xl px-8 shadow-lg"
                  data-testid="button-upload-first"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add photos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredItems.map((item, index) => (
                <div 
                  key={item.id}
                  className={`outfit-card bg-card rounded-3xl overflow-hidden border cursor-pointer relative group shadow-sm ${
                    isSelectMode && selectedItems.includes(item.id) 
                      ? 'border-primary ring-2 ring-primary/30' 
                      : 'border-border/50'
                  }`}
                  onClick={() => handleItemSelect(item.id)}
                  data-testid={`card-outfit-${item.id}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative overflow-hidden">
                    <img 
                      src={item.photoURL} 
                      alt="Outfit" 
                      className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">
                      {formatDate(item.dateAdded)}
                    </div>
                    {item.title && (
                      <p className="text-sm font-bold text-foreground mb-1 line-clamp-1">
                        {item.title}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.memoryNote || "No description"}
                    </p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center mt-3 text-xs flex-wrap gap-1.5">
                        {item.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.visibility !== "private" && item.postedAt && (
                      <div className="flex items-center mt-2 text-xs text-primary font-medium">
                        <Users className="w-3 h-3 mr-1" />
                        Shared • {item.visibility}
                      </div>
                    )}
                  </div>
                  
                  {/* Menu Button */}
                  {!isSelectMode && !isBulkSelectMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-3 right-3 w-9 h-9 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:bg-muted text-muted-foreground rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg border border-border/30"
                          data-testid={`button-menu-${item.id}`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToMove(item.id);
                            setShowMoveSheet(true);
                          }}
                          className="cursor-pointer"
                        >
                          <FolderInput className="w-4 h-4 mr-2" />
                          Move to...
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this outfit?")) {
                              deleteItemMutation.mutate(item.id);
                            }
                          }}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                  {/* Bulk Select Checkbox */}
                  {isBulkSelectMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBulkSelectedItems(prev => 
                          prev.includes(item.id) 
                            ? prev.filter(id => id !== item.id)
                            : [...prev, item.id]
                        );
                      }}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg ${
                        bulkSelectedItems.includes(item.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white/90 dark:bg-gray-900/90 border-2 border-primary/50'
                      }`}
                    >
                      {bulkSelectedItems.includes(item.id) && <Check className="w-4 h-4" />}
                    </button>
                  )}
                  
                  {/* Select Mode Checkmark (for polls) */}
                  {isSelectMode && selectedItems.includes(item.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
        </>
        )}

        {/* POLLS TAB */}
        {activeTab === "polls" && (
          <section className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Polls 🗳️</h2>
              <Button 
                onClick={startSelectMode}
                className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                data-testid="button-create-poll-tab"
              >
                Create Poll
              </Button>
            </div>
            {polls.length === 0 ? (
              <Card className="bg-card rounded-2xl border-border">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">🗳️</div>
                  <h3 className="text-lg font-semibold mb-2">No polls yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first poll to get feedback from friends!</p>
                  <Button onClick={startSelectMode} data-testid="button-create-first-poll">
                    Create your first poll ✨
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {polls.map((poll) => (
                  <Card key={poll.id} className="bg-card rounded-2xl border-border hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold mb-1">{poll.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Created {formatDate(poll.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/poll/${poll.shareLink}`}>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              data-testid={`button-view-poll-${poll.id}`}
                            >
                              View
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary/20"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/poll/${poll.shareLink}`);
                              toast({
                                title: "Link copied! 📤",
                                description: "Share this link with your friends."
                              });
                            }}
                            data-testid={`button-share-poll-${poll.id}`}
                          >
                            Share 📤
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Poll ID: {poll.shareLink.slice(0, 8)}...
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <section className="mb-8">
            <Card className="bg-card rounded-2xl border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-3xl">
                    {user ? (user as any).username?.charAt(0)?.toUpperCase() || "👤" : "👤"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{user ? (user as any).username || "Fashion Lover" : "Demo User"}</h2>
                    <p className="text-muted-foreground">Closet curator since 2024</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-foreground">{items.length}</div>
                    <div className="text-sm text-muted-foreground">Outfits</div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-foreground">{polls.length}</div>
                    <div className="text-sm text-muted-foreground">Polls</div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-foreground">156</div>
                    <div className="text-sm text-muted-foreground">Votes</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => setActiveTab("closet")}
                    data-testid="button-profile-closet"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    View My Closet
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => setActiveTab("polls")}
                    data-testid="button-profile-polls"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    View My Polls
                  </Button>
                  {isAuthenticated && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => window.location.href = "/api/logout"}
                      data-testid="button-logout-profile"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      <Button 
        className="floating-btn fixed bottom-24 md:bottom-8 right-6 w-14 h-14 gradient-accent text-white rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-primary/30 z-50 hover:scale-110"
        onClick={() => {
          if (isTrialMode) {
            toast({
              title: "Demo Mode",
              description: "Upload feature is view-only in demo. Sign up to upload your own outfits!",
            });
          } else {
            setShowUpload(true);
          }
        }}
        data-testid="button-floating-add"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Desktop Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-full w-64 bg-card/80 backdrop-blur-xl border-r border-border hidden md:flex flex-col z-30">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 gradient-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">Closet Memories</h1>
              <p className="text-xs text-muted-foreground">Style organized</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab("home")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "home" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} 
            data-testid="sidebar-home"
          >
            <HomeIcon className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("closet")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "closet" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} 
            data-testid="sidebar-closet"
          >
            <Shirt className="w-5 h-5" />
            <span className="font-medium">Closet</span>
          </button>
          
          <Link href="/media" className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200" data-testid="sidebar-feed">
            <PlaySquare className="w-5 h-5" />
            <span className="font-medium">Feed</span>
          </Link>
          
          <Link href="/friends" className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200" data-testid="sidebar-friends">
            <Users className="w-5 h-5" />
            <span className="font-medium">Friends</span>
          </Link>
          
          <Link href="/wishlist" className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200" data-testid="sidebar-wishlist">
            <Heart className="w-5 h-5" />
            <span className="font-medium">Wishlist</span>
          </Link>
          
          <button 
            onClick={() => setActiveTab("polls")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "polls" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} 
            data-testid="sidebar-polls"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Polls</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "profile" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} 
            data-testid="sidebar-profile"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50 safe-area-bottom md:hidden z-40">
        <div className="flex justify-around py-2">
          <button 
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all ${activeTab === "home" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} 
            data-testid="nav-home"
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === "home" ? "bg-primary/10" : ""}`}>
              <HomeIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button 
            onClick={() => setActiveTab("closet")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all ${activeTab === "closet" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} 
            data-testid="nav-closet"
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === "closet" ? "bg-primary/10" : ""}`}>
              <Shirt className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Closet</span>
          </button>
          <Link href="/media" className="flex flex-col items-center space-y-1 p-2 rounded-xl text-muted-foreground hover:text-foreground transition-all" data-testid="nav-feed">
            <div className="p-2 rounded-xl">
              <PlaySquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Feed</span>
          </Link>
          <Link href="/wishlist" className="flex flex-col items-center space-y-1 p-2 rounded-xl text-muted-foreground hover:text-foreground transition-all" data-testid="nav-wishlist">
            <div className="p-2 rounded-xl">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Wishlist</span>
          </Link>
          <button 
            onClick={() => setActiveTab("polls")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all ${activeTab === "polls" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} 
            data-testid="nav-polls"
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === "polls" ? "bg-primary/10" : ""}`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Polls</span>
          </button>
        </div>
      </nav>

      {/* Create Poll Modal */}
      <Dialog open={showPollModal} onOpenChange={setShowPollModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create a Poll ✨</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium mb-2">Poll title</Label>
              <Input 
                type="text" 
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
                placeholder="Help me pick my outfit! 💫"
                data-testid="input-poll-title"
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium mb-2">Selected outfits ({selectedItems.length}/3)</Label>
              <div className="text-sm text-muted-foreground mb-3">
                {selectedItems.length === 0 
                  ? "Tap outfits from your closet to add them to the poll" 
                  : `${selectedItems.length} outfit${selectedItems.length === 1 ? '' : 's'} selected`
                }
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleCreatePoll}
                disabled={createPollMutation.isPending || selectedItems.length < 2}
                data-testid="button-create-poll-confirm"
              >
                {createPollMutation.isPending ? "Creating..." : "Create Poll 🎉"}
              </Button>
              <Button 
                variant="secondary"
                onClick={cancelSelectMode}
                data-testid="button-cancel-poll"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Outfit Suggestion Modal */}
      <Dialog open={showSuggestionModal} onOpenChange={setShowSuggestionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Today's Suggestion ✨</DialogTitle>
          </DialogHeader>
          
          {outfitSuggestion && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-semibold text-lg mb-2">{outfitSuggestion.title}</h4>
                <p className="text-muted-foreground mb-4">{outfitSuggestion.description}</p>
              </div>
              
              <div className="space-y-4">
                {outfitSuggestion.suggestions.map((suggestion) => (
                  <Card key={suggestion.option} className="bg-muted/20 border-border overflow-hidden">
                    <CardContent className="p-4">
                      <div className="font-medium mb-3 text-center">
                        {suggestion.description} ✨
                      </div>
                      
                      {/* Outfit Images Grid */}
                      {suggestion.items && suggestion.items.length > 0 && (
                        <div className={`grid gap-2 mb-3 ${suggestion.items.length === 1 ? 'grid-cols-1' : suggestion.items.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                          {suggestion.items.map((item) => (
                            <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                              <img 
                                src={item.photoURL} 
                                alt={item.title || "Outfit"} 
                                className="w-full h-full object-cover"
                              />
                              {item.title && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                  <p className="text-white text-xs font-medium truncate">{item.title}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground text-center">
                        {suggestion.reasoning}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Nudges - Suggestions to complete wardrobe */}
              {outfitSuggestion.nudges && outfitSuggestion.nudges.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    💡 Complete your closet
                  </div>
                  <ul className="space-y-1">
                    {outfitSuggestion.nudges.map((nudge, index) => (
                      <li key={index} className="text-sm text-amber-700 dark:text-amber-300">
                        {nudge}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex space-x-3">
                <Button 
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setShowSuggestionModal(false)}
                  data-testid="button-love-suggestion"
                >
                  Love it! 💖
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => getOutfitSuggestionMutation.mutate()}
                  disabled={getOutfitSuggestionMutation.isPending}
                  data-testid="button-new-suggestion"
                >
                  Try Again 🔄
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Poll Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Poll Created! 🎉</DialogTitle>
          </DialogHeader>
          
          {sharedPoll && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-4">🗳️✨</div>
                <h4 className="font-semibold text-lg mb-2">{sharedPoll.title}</h4>
                <p className="text-muted-foreground mb-4">Share with your friends and let them help you decide!</p>
              </div>
              
              {/* Copy Link Section */}
              <div className="space-y-3">
                <div className="bg-muted/20 border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">Poll Link</div>
                      <div className="text-xs text-muted-foreground truncate">
                        /poll/{sharedPoll.shareLink}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => copyPollLink(sharedPoll.shareLink)}
                      className="ml-3"
                      data-testid="button-copy-poll-link"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </Button>
                  </div>
                </div>
              </div>

              {/* Friends List */}
              {friends.length > 0 && (
                <div className="space-y-3">
                  <div className="font-medium text-sm">Share with friends</div>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {friends.slice(0, 5).map((friend: any) => (
                      <div 
                        key={friend.friendId} 
                        className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg"
                        data-testid={`friend-item-${friend.friendId}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="font-medium text-sm">{friend.username}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyPollLink(sharedPoll.shareLink)}
                          data-testid={`button-share-with-${friend.friendId}`}
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          Share
                        </Button>
                      </div>
                    ))}
                  </div>
                  {friends.length > 5 && (
                    <div className="text-xs text-muted-foreground text-center">
                      And {friends.length - 5} more friends...
                    </div>
                  )}
                </div>
              )}

              {friends.length === 0 && (
                <div className="text-center py-4">
                  <div className="text-muted-foreground mb-3">No friends yet!</div>
                  <Link href="/friends">
                    <Button variant="outline" size="sm" data-testid="button-find-friends">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Find Friends
                    </Button>
                  </Link>
                </div>
              )}
              
              <div className="flex space-x-3">
                <Button 
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setShowShareModal(false)}
                  data-testid="button-done-sharing"
                >
                  Done 🎉
                </Button>
                <Link href="/friends" className="flex-1">
                  <Button 
                    variant="outline"
                    className="w-full"
                    data-testid="button-manage-friends"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Friends
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Recorder */}
      {showVideoRecorder && (
        <VideoRecorder
          onVideoRecorded={handleVideoRecorded}
          onCancel={() => {
            setShowVideoRecorder(false);
            setShowUpload(true);
          }}
        />
      )}

      {/* Move to Category Sheet */}
      <Sheet open={showMoveSheet} onOpenChange={setShowMoveSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-center">
              {itemToMove ? "Move to..." : `Move ${bulkSelectedItems.length} items to...`}
            </SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 pb-6">
            {ITEM_CATEGORIES.map((cat) => {
              const tabInfo = categoryTabs.find(t => t.id === cat);
              return (
                <button
                  key={cat}
                  onClick={() => {
                    if (itemToMove) {
                      moveItemMutation.mutate({ itemId: itemToMove, category: cat });
                    } else if (bulkSelectedItems.length > 0) {
                      bulkMoveItemsMutation.mutate({ itemIds: bulkSelectedItems, category: cat });
                    }
                  }}
                  disabled={moveItemMutation.isPending || bulkMoveItemsMutation.isPending}
                  className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <span className="text-2xl">{tabInfo?.icon}</span>
                  <span className="font-medium">{tabInfo?.label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
