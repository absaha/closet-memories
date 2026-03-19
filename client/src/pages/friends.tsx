import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { sounds, initAudio } from "@/lib/sounds";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar, BottomNav } from "@/components/Sidebar";
import type { User, Friend, FriendRequest } from "@shared/schema";

// Mock user ID for demo - in real app this would come from auth
const MOCK_USER_ID = "user-123";

interface FriendWithDetails extends Friend {
  username: string;
}

interface FriendRequestWithDetails extends FriendRequest {
  fromUsername: string;
  toUsername: string;
}

export default function Friends() {
  const [activeTab, setActiveTab] = useState("find");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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

  // Fetch current friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery<FriendWithDetails[]>({
    queryKey: ["/api/friends", MOCK_USER_ID],
    queryFn: async () => {
      const response = await fetch(`/api/friends?userId=${MOCK_USER_ID}`);
      if (!response.ok) throw new Error('Failed to fetch friends');
      return response.json();
    }
  });

  // Fetch incoming requests
  const { data: incomingRequests = [], isLoading: incomingLoading } = useQuery<FriendRequestWithDetails[]>({
    queryKey: ["/api/friend-requests", "incoming", MOCK_USER_ID],
    queryFn: async () => {
      const response = await fetch(`/api/friend-requests?userId=${MOCK_USER_ID}&type=incoming`);
      if (!response.ok) throw new Error('Failed to fetch incoming requests');
      return response.json();
    }
  });

  // Fetch outgoing requests
  const { data: outgoingRequests = [], isLoading: outgoingLoading } = useQuery<FriendRequestWithDetails[]>({
    queryKey: ["/api/friend-requests", "outgoing", MOCK_USER_ID],
    queryFn: async () => {
      const response = await fetch(`/api/friend-requests?userId=${MOCK_USER_ID}&type=outgoing`);
      if (!response.ok) throw new Error('Failed to fetch outgoing requests');
      return response.json();
    }
  });

  // Search users mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      setIsSearching(true);
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&excludeUserId=${MOCK_USER_ID}`);
      if (!response.ok) throw new Error('Failed to search users');
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data);
      setIsSearching(false);
    },
    onError: (error) => {
      setIsSearching(false);
      toast({
        title: "Search failed",
        description: "Could not search for users. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (toUserId: string) => {
      const response = await apiRequest("POST", "/api/friend-requests", {
        fromUserId: MOCK_USER_ID,
        toUserId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests", "outgoing", MOCK_USER_ID] });
      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent successfully."
      });
      // Update search results to reflect the sent request
      handleSearch(searchQuery);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send request",
        description: error.message || "Could not send friend request. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiRequest("POST", `/api/friend-requests/${requestId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests", "incoming", MOCK_USER_ID] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends", MOCK_USER_ID] });
      toast({
        title: "Friend request accepted!",
        description: "You are now friends!"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to accept request",
        description: "Could not accept friend request. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Decline friend request mutation
  const declineRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiRequest("POST", `/api/friend-requests/${requestId}/decline`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests", "incoming", MOCK_USER_ID] });
      toast({
        title: "Friend request declined",
        description: "The friend request has been declined."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to decline request",
        description: "Could not decline friend request. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const response = await apiRequest("DELETE", `/api/friends/${friendId}?userId=${MOCK_USER_ID}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends", MOCK_USER_ID] });
      toast({
        title: "Friend removed",
        description: "You are no longer friends."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove friend",
        description: "Could not remove friend. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSearch = async (query: string) => {
    if (query.trim().length >= 2) {
      searchMutation.mutate(query.trim());
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length >= 2) {
      handleSearch(value);
    } else {
      setSearchResults([]);
    }
  };

  // Check if user already has a pending request or is a friend
  const getUserStatus = (userId: string) => {
    const isFriend = friends.some(friend => friend.friendId === userId);
    const hasOutgoingRequest = outgoingRequests.some(req => req.toUserId === userId);
    const hasIncomingRequest = incomingRequests.some(req => req.fromUserId === userId);
    
    if (isFriend) return 'friend';
    if (hasOutgoingRequest) return 'pending';
    if (hasIncomingRequest) return 'incoming';
    return 'none';
  };

  return (
    <div className="min-h-screen gradient-bg relative z-10 bg-background">
      {/* Desktop Sidebar Navigation */}
      <Sidebar activePage="friends" />

      {/* Header with back button */}
      <header className="glass-effect sticky top-0 z-40 border-b border-border md:ml-64" data-testid="header">
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
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="m22 21-3-3m0 0a5.5 5.5 0 1 0-7.78-7.78 5.5 5.5 0 0 0 7.78 7.78Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold text-foreground">Friends</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl md:ml-64 pb-24 md:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6" data-testid="tabs-list">
            <TabsTrigger value="find" data-testid="tab-find">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35"/>
              </svg>
              Find Friends
            </TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Requests
              {incomingRequests.length > 0 && (
                <Badge className="ml-2 bg-primary text-primary-foreground" data-testid="badge-requests-count">
                  {incomingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="friends" data-testid="tab-friends">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              My Friends ({friends.length})
            </TabsTrigger>
          </TabsList>

          {/* Find Friends Tab */}
          <TabsContent value="find" className="space-y-4">
            <Card className="bg-card rounded-2xl border-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35"/>
                  </svg>
                  <Input
                    placeholder="Search by username..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className="flex-1"
                    data-testid="input-search-users"
                  />
                </div>

                {isSearching && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching...
                    </div>
                  </div>
                )}

                {!isSearching && searchQuery.length > 0 && searchQuery.length < 2 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Type at least 2 characters to search
                  </div>
                )}

                {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found matching "{searchQuery}"
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.map((user) => {
                      const status = getUserStatus(user.id);
                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                          data-testid={`user-result-${user.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium" data-testid={`text-username-${user.id}`}>
                                {user.firstName || user.email?.split('@')[0] || 'User'}
                              </div>
                            </div>
                          </div>
                          <div>
                            {status === 'friend' && (
                              <Badge variant="secondary" data-testid={`status-friend-${user.id}`}>
                                Friends
                              </Badge>
                            )}
                            {status === 'pending' && (
                              <Badge variant="outline" data-testid={`status-pending-${user.id}`}>
                                Request Sent
                              </Badge>
                            )}
                            {status === 'incoming' && (
                              <Badge className="bg-primary text-primary-foreground" data-testid={`status-incoming-${user.id}`}>
                                Request Received
                              </Badge>
                            )}
                            {status === 'none' && (
                              <Button
                                size="sm"
                                onClick={() => sendRequestMutation.mutate(user.id)}
                                disabled={sendRequestMutation.isPending}
                                data-testid={`button-send-request-${user.id}`}
                              >
                                {sendRequestMutation.isPending ? (
                                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                )}
                                Add Friend
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {searchQuery.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35"/>
                    </svg>
                    Search for users to add as friends
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            {/* Incoming Requests */}
            <Card className="bg-card rounded-2xl border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  Incoming Requests ({incomingRequests.length})
                </h3>
                
                {incomingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading requests...
                    </div>
                  </div>
                ) : incomingRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    No incoming friend requests
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        data-testid={`request-incoming-${request.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium" data-testid={`text-from-username-${request.id}`}>
                              {request.fromUsername}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => acceptRequestMutation.mutate(request.id)}
                            disabled={acceptRequestMutation.isPending || declineRequestMutation.isPending}
                            data-testid={`button-accept-${request.id}`}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => declineRequestMutation.mutate(request.id)}
                            disabled={acceptRequestMutation.isPending || declineRequestMutation.isPending}
                            data-testid={`button-decline-${request.id}`}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outgoing Requests */}
            <Card className="bg-card rounded-2xl border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  Outgoing Requests ({outgoingRequests.length})
                </h3>
                
                {outgoingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading requests...
                    </div>
                  </div>
                ) : outgoingRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    No outgoing friend requests
                  </div>
                ) : (
                  <div className="space-y-3">
                    {outgoingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        data-testid={`request-outgoing-${request.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium" data-testid={`text-to-username-${request.id}`}>
                              {request.toUsername}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Sent {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" data-testid={`status-pending-${request.id}`}>
                          Pending
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Friends Tab */}
          <TabsContent value="friends" className="space-y-4">
            <Card className="bg-card rounded-2xl border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  My Friends ({friends.length})
                </h3>
                
                {friendsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading friends...
                    </div>
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="mb-4">You don't have any friends yet</p>
                    <Button onClick={() => setActiveTab("find")} data-testid="button-find-friends">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35"/>
                      </svg>
                      Find Friends
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        data-testid={`friend-${friend.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium" data-testid={`text-friend-username-${friend.id}`}>
                              {friend.username}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Friends since {new Date(friend.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              data-testid={`button-remove-friend-${friend.id}`}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent data-testid={`dialog-remove-friend-${friend.id}`}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Friend</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {friend.username} from your friends list? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid={`button-cancel-remove-${friend.id}`}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeFriendMutation.mutate(friend.friendId)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-testid={`button-confirm-remove-${friend.id}`}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav activePage="friends" />
    </div>
  );
}