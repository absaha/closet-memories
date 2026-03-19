import { Link, useLocation } from "wouter";
import { Home as HomeIcon, Shirt, PlaySquare, Users, Heart, BarChart3, User, Sparkles } from "lucide-react";

interface SidebarProps {
  activePage?: "home" | "closet" | "feed" | "friends" | "wishlist" | "polls" | "profile";
}

export function Sidebar({ activePage }: SidebarProps) {
  const [location] = useLocation();
  
  const getActiveState = (page: string) => {
    if (activePage) return activePage === page;
    if (page === "friends") return location === "/friends";
    if (page === "feed") return location === "/media";
    if (page === "wishlist") return location === "/wishlist";
    return false;
  };

  const navItemClass = (page: string) => 
    `w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      getActiveState(page) 
        ? "bg-primary text-white shadow-lg shadow-primary/30" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-card/80 backdrop-blur-xl border-r border-border hidden md:flex flex-col z-30">
      <div className="p-6 border-b border-border/50">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-11 h-11 gradient-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gradient">Closet Memories</h1>
            <p className="text-xs text-muted-foreground">Style organized</p>
          </div>
        </Link>
      </div>
      
      <div className="flex-1 p-4 space-y-1">
        <Link href="/" className={navItemClass("home")} data-testid="sidebar-home">
          <HomeIcon className="w-5 h-5" />
          <span className="font-medium">Home</span>
        </Link>
        
        <Link href="/" className={navItemClass("closet")} data-testid="sidebar-closet">
          <Shirt className="w-5 h-5" />
          <span className="font-medium">Closet</span>
        </Link>
        
        <Link href="/media" className={navItemClass("feed")} data-testid="sidebar-feed">
          <PlaySquare className="w-5 h-5" />
          <span className="font-medium">Feed</span>
        </Link>
        
        <Link href="/friends" className={navItemClass("friends")} data-testid="sidebar-friends">
          <Users className="w-5 h-5" />
          <span className="font-medium">Friends</span>
        </Link>
        
        <Link href="/wishlist" className={navItemClass("wishlist")} data-testid="sidebar-wishlist">
          <Heart className="w-5 h-5" />
          <span className="font-medium">Wishlist</span>
        </Link>
        
        <Link href="/" className={navItemClass("polls")} data-testid="sidebar-polls">
          <BarChart3 className="w-5 h-5" />
          <span className="font-medium">Polls</span>
        </Link>
        
        <Link href="/" className={navItemClass("profile")} data-testid="sidebar-profile">
          <User className="w-5 h-5" />
          <span className="font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}

export function BottomNav({ activePage }: SidebarProps) {
  const [location] = useLocation();
  
  const getActiveState = (page: string) => {
    if (activePage) return activePage === page;
    if (page === "friends") return location === "/friends";
    if (page === "feed") return location === "/media";
    if (page === "wishlist") return location === "/wishlist";
    return false;
  };

  const navItemClass = (page: string) => 
    `flex flex-col items-center space-y-1 p-2 rounded-xl transition-all ${
      getActiveState(page) ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50 safe-area-bottom md:hidden z-40">
      <div className="flex justify-around py-2">
        <Link href="/" className={navItemClass("home")} data-testid="nav-home">
          <div className={`p-2 rounded-xl ${getActiveState("home") ? "bg-primary/10" : ""}`}>
            <HomeIcon className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium">Home</span>
        </Link>
        <Link href="/" className={navItemClass("closet")} data-testid="nav-closet">
          <div className={`p-2 rounded-xl ${getActiveState("closet") ? "bg-primary/10" : ""}`}>
            <Shirt className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium">Closet</span>
        </Link>
        <Link href="/media" className={navItemClass("feed")} data-testid="nav-feed">
          <div className={`p-2 rounded-xl ${getActiveState("feed") ? "bg-primary/10" : ""}`}>
            <PlaySquare className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium">Feed</span>
        </Link>
        <Link href="/wishlist" className={navItemClass("wishlist")} data-testid="nav-wishlist">
          <div className={`p-2 rounded-xl ${getActiveState("wishlist") ? "bg-primary/10" : ""}`}>
            <Heart className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium">Wishlist</span>
        </Link>
        <Link href="/" className={navItemClass("polls")} data-testid="nav-polls">
          <div className={`p-2 rounded-xl ${getActiveState("polls") ? "bg-primary/10" : ""}`}>
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium">Polls</span>
        </Link>
      </div>
    </nav>
  );
}
