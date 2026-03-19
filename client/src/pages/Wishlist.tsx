import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useTrial } from "@/contexts/TrialContext";
import { Home as HomeIcon, Shirt, Heart, Users, BarChart3, Plus, Trash2, ExternalLink, ShoppingBag, Tag, Store, DollarSign, LogOut, ArrowLeft } from "lucide-react";
import type { WishlistItem } from "@shared/schema";

export default function Wishlist() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    store: "",
    price: "",
    imageUrl: "",
    productUrl: "",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { isTrialMode } = useTrial();

  const { data: wishlistItems = [], isLoading } = useQuery<WishlistItem[]>({
    queryKey: ["/api/wishlist"],
    enabled: isAuthenticated
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/wishlist", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      setShowAddModal(false);
      setFormData({ name: "", brand: "", store: "", price: "", imageUrl: "", productUrl: "", notes: "" });
      toast({
        title: "Added to wishlist!",
        description: "Your fashion find has been saved."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to wishlist.",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/wishlist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Removed",
        description: "Item removed from wishlist."
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the item.",
        variant: "destructive"
      });
      return;
    }
    createMutation.mutate(formData);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card/80 backdrop-blur border-border/50">
          <CardContent className="p-8 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-pink-500" />
            <h2 className="text-2xl font-bold mb-2">Sign in to save your wishlist</h2>
            <p className="text-muted-foreground mb-6">Create an account to start saving your favorite fashion finds from any brand or store.</p>
            <a href="/api/login">
              <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                Sign In
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="w-6 h-6 text-pink-500" />
                My Wishlist
              </h1>
              <p className="text-muted-foreground text-sm">Save fashion items you love from any brand or store</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-card/80 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="w-full h-48 shimmer rounded-lg mb-3"></div>
                  <div className="h-5 shimmer rounded w-3/4 mb-2"></div>
                  <div className="h-4 shimmer rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur border-border/50">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
              <p className="text-muted-foreground mb-6">Start adding fashion items you love from any brand or store!</p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="bg-card/80 backdrop-blur border-border/50 overflow-hidden group hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {item.imageUrl ? (
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400";
                        }}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="destructive"
                          className="rounded-full w-8 h-8"
                          onClick={() => deleteMutation.mutate(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950 dark:to-purple-950 flex items-center justify-center relative">
                      <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="destructive"
                          className="rounded-full w-8 h-8"
                          onClick={() => deleteMutation.mutate(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                      {item.brand && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {item.brand}
                        </span>
                      )}
                      {item.store && (
                        <span className="flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          {item.store}
                        </span>
                      )}
                      {item.price && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                          <DollarSign className="w-3 h-3" />
                          {item.price}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.notes}</p>
                    )}
                    {item.productUrl && (
                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 text-sm text-pink-500 hover:text-pink-600 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Product
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-card border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Add to Wishlist
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Vintage Denim Jacket"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Levi's"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="store">Store</Label>
                <Input
                  id="store"
                  placeholder="e.g., Urban Outfitters"
                  value={formData.store}
                  onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                placeholder="e.g., $89"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="Paste image link here"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="productUrl">Product Link</Label>
              <Input
                id="productUrl"
                placeholder="Link to product page"
                value={formData.productUrl}
                onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about this item..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                {createMutation.isPending ? "Adding..." : "Add to Wishlist"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border/50 p-2 z-50">
        <div className="max-w-md mx-auto flex justify-around">
          <Link href="/">
            <Button variant="ghost" className="flex-col gap-1 h-auto py-2 px-4">
              <HomeIcon className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="flex-col gap-1 h-auto py-2 px-4">
              <Shirt className="w-5 h-5" />
              <span className="text-xs">Closet</span>
            </Button>
          </Link>
          <Link href="/wishlist">
            <Button variant="ghost" className="flex-col gap-1 h-auto py-2 px-4 text-pink-500">
              <Heart className="w-5 h-5 fill-current" />
              <span className="text-xs font-medium">Wishlist</span>
            </Button>
          </Link>
          <Link href="/friends">
            <Button variant="ghost" className="flex-col gap-1 h-auto py-2 px-4">
              <Users className="w-5 h-5" />
              <span className="text-xs">Friends</span>
            </Button>
          </Link>
          <Link href="/media">
            <Button variant="ghost" className="flex-col gap-1 h-auto py-2 px-4">
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">Feed</span>
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
