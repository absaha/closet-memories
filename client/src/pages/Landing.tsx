import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, Video, ShoppingBag, Heart, Play, ArrowRight, Zap, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import demoVideo from "@assets/invideo-ai-1080_I_Let_an_App_Dress_Me._Shocked._2025-12-14_1765755276603.mp4";
import avatar1 from "@assets/stock_images/young_teenage_girl_s_5a5d222c.jpg";
import avatar2 from "@assets/stock_images/young_teenage_girl_s_93e43945.jpg";
import avatar3 from "@assets/stock_images/young_teenage_girl_s_b851a6a3.jpg";
import avatar4 from "@assets/stock_images/young_teenage_girl_s_da4a53c5.jpg";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const stagger = {
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    { icon: Video, title: "Record Videos", desc: "Capture outfit moments", color: "from-violet-500 to-purple-600" },
    { icon: ShoppingBag, title: "Tag & Shop", desc: "Add shoppable links", color: "from-pink-500 to-rose-600" },
    { icon: Heart, title: "Share Style", desc: "Inspire your friends", color: "from-orange-400 to-amber-500" },
    { icon: Zap, title: "AI Suggestions", desc: "Smart outfit picks", color: "from-cyan-400 to-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="relative z-10 px-6 py-4">
          <nav className="max-w-7xl mx-auto flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 gradient-accent rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">Closet Memories</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Button
                variant="ghost"
                onClick={() => window.location.href = "/api/login"}
                className="hidden sm:flex"
                data-testid="button-sign-in-nav"
              >
                Sign In
              </Button>
              <Button
                onClick={() => setLocation("/demo")}
                className="gradient-accent text-white shadow-lg hover:shadow-xl transition-all"
                data-testid="button-get-started"
              >
                Get Started
              </Button>
            </motion.div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-8 lg:py-0">
          {/* Left: Content */}
          <motion.div 
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
            variants={stagger}
            className="max-w-xl text-center lg:text-left z-10"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="mb-6 flex justify-center lg:justify-start">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                <Sparkles className="w-4 h-4" />
                Your style, organized
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight"
            >
              <span className="text-foreground">Your Closet,</span>
              <br />
              <span className="text-gradient">Reimagined</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-md mx-auto lg:mx-0"
            >
              Record outfit videos, tag clothing with shoppable links, get AI-powered style suggestions, and share your fashion moments.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center"
            >
              <Button
                size="lg"
                onClick={() => setLocation("/demo")}
                className="w-full sm:w-auto text-lg px-8 py-6 gradient-accent text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group"
                data-testid="button-view-demo"
              >
                <Play className="w-5 h-5 mr-2" />
                Explore Demo
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => window.location.href = "/api/login"}
                className="w-full sm:w-auto text-lg px-8 py-6 border-2 hover:bg-muted transition-all"
                data-testid="button-sign-in"
              >
                Sign In
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div 
              variants={fadeInUp}
              className="mt-8 flex items-center justify-center lg:justify-start gap-4"
            >
              <div className="flex -space-x-3">
                {[avatar1, avatar2, avatar3, avatar4].map((avatar, i) => (
                  <div 
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background overflow-hidden"
                  >
                    <img 
                      src={avatar} 
                      alt={`Fashion lover ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">1,000+</span> fashion lovers
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Demo Video */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: 3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-sm lg:max-w-md z-10"
          >
            <div 
              className="relative rounded-[2rem] overflow-hidden shadow-2xl bg-black aspect-[9/16] max-h-[65vh] mx-auto cursor-pointer group ring-4 ring-primary/20"
              onClick={() => setIsVideoPlaying(!isVideoPlaying)}
            >
              <video
                src={demoVideo}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                data-testid="video-demo"
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-gray-800">Live Demo</span>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-white">
                    <p className="font-semibold text-sm">Today's OOTD</p>
                    <p className="text-xs text-white/70">Swipe to explore more</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </main>

        {/* Feature Cards */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 px-6 pb-16"
        >
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
