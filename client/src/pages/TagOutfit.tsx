import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Item } from "@shared/schema";

// Mock user ID for demo
const MOCK_USER_ID = "user-123";

// Common outfit tags
const commonTags = [
  "casual", "dressy", "party", "work", "date night", "weekend", "cozy", "edgy", 
  "boho", "minimal", "vintage", "sporty", "chic", "trendy", "comfy", "night out"
];

export default function TagOutfit() {
  const [, params] = useRoute("/tag-outfit/:photoURL");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const photoURL = params?.photoURL ? decodeURIComponent(params.photoURL) : "";
  
  const [title, setTitle] = useState("");
  const [memoryNote, setMemoryNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [visibility, setVisibility] = useState<"private" | "friends" | "public">("friends");

  // Create outfit mutation
  const createOutfitMutation = useMutation({
    mutationFn: async (outfitData: {
      photoURL: string;
      title?: string;
      memoryNote?: string;
      tags: string[];
      visibility: "private" | "friends" | "public";
      userId: string;
    }) => {
      const response = await apiRequest("POST", "/api/items", outfitData);
      return response.json();
    },
    onSuccess: (data: Item) => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      
      // If posting to friends/public, set postedAt timestamp
      if (visibility !== "private") {
        updateOutfitPostedAt(data.id);
      }
      
      toast({
        title: visibility === "private" ? "Outfit saved! ✨" : "Outfit posted! 🎉",
        description: visibility === "private" 
          ? "Your outfit has been saved to your closet." 
          : `Your outfit is now visible to ${visibility === "friends" ? "your friends" : "everyone"}!`
      });
      
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error saving outfit",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateOutfitPostedAt = async (itemId: string) => {
    try {
      await apiRequest("PATCH", `/api/items/${itemId}/post`, {});
    } catch (error) {
      console.error("Failed to update posted timestamp:", error);
    }
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim().toLowerCase())) {
      setSelectedTags([...selectedTags, customTag.trim().toLowerCase()]);
      setCustomTag("");
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleSaveOutfit = () => {
    if (!photoURL) {
      toast({
        title: "No photo found",
        description: "Please go back and upload a photo first.",
        variant: "destructive"
      });
      return;
    }

    createOutfitMutation.mutate({
      photoURL,
      title: title.trim() || undefined,
      memoryNote: memoryNote.trim() || undefined,
      tags: selectedTags,
      visibility,
      userId: MOCK_USER_ID
    });
  };

  const handleCancel = () => {
    setLocation("/");
  };

  if (!photoURL) {
    return (
      <div className="min-h-screen gradient-bg relative z-10 bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">📷</div>
            <h2 className="text-xl font-semibold mb-2">No photo found</h2>
            <p className="text-muted-foreground mb-4">Please go back and upload a photo first.</p>
            <Button onClick={() => setLocation("/")} data-testid="button-go-back">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg relative z-10 bg-background">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-40 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="p-2"
                data-testid="button-back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <h1 className="text-xl font-bold text-foreground">Tag Your Outfit</h1>
            </div>
            <Button
              onClick={handleSaveOutfit}
              disabled={createOutfitMutation.isPending}
              className="bg-primary text-primary-foreground"
              data-testid="button-save-outfit"
            >
              {createOutfitMutation.isPending ? "Saving..." : "Save & Post"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* Photo Preview */}
            <div className="mb-6">
              <img 
                src={photoURL} 
                alt="Your outfit" 
                className="w-full max-w-sm mx-auto rounded-xl object-cover shadow-lg"
                style={{ aspectRatio: "3/4" }}
              />
            </div>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-base font-medium">Give it a title ✨</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Today's vibe, OOTD, Feeling cute..."
                  className="mt-2"
                  maxLength={100}
                  data-testid="input-outfit-title"
                />
              </div>

              {/* Memory Note */}
              <div>
                <Label htmlFor="memory" className="text-base font-medium">What's the story? 💭</Label>
                <Textarea
                  id="memory"
                  value={memoryNote}
                  onChange={(e) => setMemoryNote(e.target.value)}
                  placeholder="Going to Sarah's party tonight! Feeling cute 💖"
                  rows={3}
                  className="mt-2 resize-none"
                  maxLength={500}
                  data-testid="textarea-memory-note"
                />
              </div>

              {/* Tags */}
              <div>
                <Label className="text-base font-medium">Add tags 🏷️</Label>
                
                {/* Selected Tags */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="px-3 py-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        onClick={() => handleRemoveTag(tag)}
                        data-testid={`badge-tag-${tag}`}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add Custom Tag */}
                <div className="flex gap-2 mt-3">
                  <Input
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Add custom tag..."
                    onKeyPress={(e) => e.key === "Enter" && handleAddCustomTag()}
                    data-testid="input-custom-tag"
                  />
                  <Button
                    onClick={handleAddCustomTag}
                    variant="outline"
                    disabled={!customTag.trim()}
                    data-testid="button-add-tag"
                  >
                    Add
                  </Button>
                </div>

                {/* Common Tags */}
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Or pick from popular tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {commonTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleToggleTag(tag)}
                        data-testid={`badge-common-tag-${tag}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visibility */}
              <div>
                <Label className="text-base font-medium">Who can see this? 👀</Label>
                <Select value={visibility} onValueChange={(value: "private" | "friends" | "public") => setVisibility(value)}>
                  <SelectTrigger className="mt-2" data-testid="select-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">🔒 Just me (Private)</SelectItem>
                    <SelectItem value="friends">👥 My friends</SelectItem>
                    <SelectItem value="public">🌍 Everyone (Public)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  {visibility === "private" && "Only you can see this outfit in your closet."}
                  {visibility === "friends" && "Your friends will see this in their feed."}
                  {visibility === "public" && "Anyone can discover and see your outfit."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveOutfit}
            disabled={createOutfitMutation.isPending}
            className="flex-1 bg-gradient-to-r from-primary to-secondary text-primary-foreground"
            data-testid="button-save-and-post"
          >
            {createOutfitMutation.isPending ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : (
              <span>
                {visibility === "private" ? "Save to Closet" : `Post to ${visibility === "friends" ? "Friends" : "Public"}`} ✨
              </span>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}