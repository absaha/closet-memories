import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { sounds, initAudio } from "@/lib/sounds";
import { Sidebar, BottomNav } from "@/components/Sidebar";
import type { Item } from "@shared/schema";

interface PollData {
  id: string;
  title: string;
  items: Item[];
  voteCounts: Record<string, number>;
  totalVotes: number;
  createdAt: string;
}

export default function Poll() {
  const [, params] = useRoute("/poll/:shareLink");
  const shareLink = params?.shareLink;
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    initAudio();
  }, []);

  const handleBack = () => {
    sounds.click();
    setLocation(isAuthenticated ? "/" : "/demo");
  };

  // Fetch poll data
  const { data: poll, isLoading, error } = useQuery<PollData>({
    queryKey: ["/api/polls", shareLink],
    queryFn: async () => {
      const response = await fetch(`/api/polls/${shareLink}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Poll not found");
        }
        throw new Error("Failed to fetch poll");
      }
      return response.json();
    },
    enabled: !!shareLink,
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (selectedItemId: string) => {
      const response = await apiRequest("POST", `/api/polls/${shareLink}/vote`, {
        selectedItemId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls", shareLink] });
      setHasVoted(true);
      toast({
        title: "Vote submitted! 🗳️",
        description: "Thanks for helping choose the perfect outfit!"
      });
    },
    onError: (error: any) => {
      const message = error.message || "Failed to submit vote";
      if (message.includes("already voted")) {
        setHasVoted(true);
        toast({
          title: "Already voted",
          description: "You can only vote once per poll.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error submitting vote",
          description: message,
          variant: "destructive"
        });
      }
    }
  });

  const handleVote = () => {
    if (!selectedItemId || hasVoted) return;
    sounds.vote();
    voteMutation.mutate(selectedItemId);
  };

  const getVotePercentage = (itemId: string) => {
    if (!poll || poll.totalVotes === 0) return 0;
    return Math.round((poll.voteCounts[itemId] || 0) / poll.totalVotes * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg relative z-10 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🗳️</div>
          <div className="text-lg font-semibold">Loading poll...</div>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen gradient-bg relative z-10 bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">😕</div>
            <h1 className="text-xl font-bold mb-2">Poll not found</h1>
            <p className="text-muted-foreground mb-4">
              This poll might have been deleted or the link is invalid.
            </p>
            <Button onClick={() => window.location.href = "/"} data-testid="button-go-home">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg relative z-10 bg-background">
      {/* Desktop Sidebar Navigation */}
      <Sidebar activePage="polls" />

      {/* Header with back button */}
      <header className="glass-effect sticky top-0 z-40 border-b border-border md:ml-64">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="rounded-xl md:hidden"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">🗳️</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">Poll</h1>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                sounds.share();
                navigator.clipboard.writeText(window.location.href);
                toast({ title: "Link copied!", description: "Share this poll with friends" });
              }}
              className="rounded-xl"
              data-testid="button-share-poll"
            >
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl md:ml-64 pb-24 md:pb-6">
        <Card className="bg-card rounded-2xl border-border mb-6">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2" data-testid="text-poll-title">{poll.title}</h2>
              <p className="text-muted-foreground">
                {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''} • Created {formatDate(poll.createdAt)}
              </p>
            </div>

            {/* Poll Options */}
            <div className="space-y-4 mb-6">
              {poll.items.map((item) => {
                const voteCount = poll.voteCounts[item.id] || 0;
                const percentage = getVotePercentage(item.id);
                const isSelected = selectedItemId === item.id;
                
                return (
                  <div
                    key={item.id}
                    className={`relative cursor-pointer transition-all rounded-xl overflow-hidden border-2 ${
                      hasVoted 
                        ? 'cursor-default' 
                        : isSelected 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => !hasVoted && setSelectedItemId(item.id)}
                    data-testid={`option-${item.id}`}
                  >
                    <div className="flex items-center p-4">
                      <img 
                        src={item.photoURL} 
                        alt="Outfit option" 
                        className="w-20 h-20 object-cover rounded-lg mr-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium mb-1">
                          {item.memoryNote || "Outfit option"}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Added {formatDate(item.dateAdded.toString())}
                        </div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {item.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="text-xs bg-secondary/20 px-2 py-1 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{percentage}%</div>
                        <div className="text-sm text-muted-foreground">
                          ({voteCount} vote{voteCount !== 1 ? 's' : ''})
                        </div>
                      </div>
                    </div>
                    
                    {/* Vote percentage bar */}
                    {hasVoted && poll.totalVotes > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Selection indicator */}
                    {isSelected && !hasVoted && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Vote Button */}
            {!hasVoted && (
              <div className="text-center">
                <Button 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-lg font-semibold"
                  onClick={handleVote}
                  disabled={!selectedItemId || voteMutation.isPending}
                  data-testid="button-submit-vote"
                >
                  {voteMutation.isPending ? "Submitting vote..." : selectedItemId ? "Submit Vote 🗳️" : "Select an outfit to vote"}
                </Button>
              </div>
            )}

            {hasVoted && (
              <div className="text-center">
                <div className="text-lg font-semibold text-primary mb-2">Thanks for voting! ✨</div>
                <p className="text-muted-foreground">
                  Your vote has been submitted. Check back later to see the final results!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Share Section */}
        <Card className="bg-card rounded-2xl border-border">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Share this poll</h3>
            <p className="text-muted-foreground mb-4">
              Let your friends help you decide!
            </p>
            <Button 
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({
                  title: "Link copied! 📤",
                  description: "Share this link with your friends."
                });
              }}
              data-testid="button-copy-link"
            >
              Copy Link 📤
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav activePage="polls" />
    </div>
  );
}
