import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertItemSchema, insertPollSchema, insertPollVoteSchema, insertFriendRequestSchema, insertWishlistItemSchema } from "@shared/schema";
import { ObjectStorageService } from "./objectStorage";
import { generateOutfitSuggestion, classifyClothingImage } from "./openai";
import { setupAuth, isAuthenticated } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  
  const objectStorageService = new ObjectStorageService();

  // Helper function to validate user exists
  const ensureUserExists = async (userId: string) => {
    const user = await storage.getUser(userId);
    return !!user;
  };

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Demo data endpoint for trial users
  app.get('/api/demo/items', async (req, res) => {
    try {
      // Return demo items for trial users - a fully populated closet
      const demoItems = [
        {
          id: 'demo-1',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
          title: 'Cozy Winter Sweater',
          memoryNote: 'Perfect for chilly days ❄️',
          tags: ['winter', 'cozy', 'casual'],
          dateAdded: new Date('2024-01-15'),
          visibility: 'public',
          postedAt: new Date('2024-01-15'),
          scheduledDay: null,
          mediaType: 'photo'
        },
        {
          id: 'demo-2',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
          title: 'Summer Dress',
          memoryNote: 'Wore this to the beach party 🏖️',
          tags: ['summer', 'dress', 'party'],
          dateAdded: new Date('2024-02-20'),
          visibility: 'public',
          postedAt: new Date('2024-02-20'),
          scheduledDay: null,
          mediaType: 'photo',
          clothingLinks: [
            { name: 'White Summer Dress', url: 'https://example.com/dress' }
          ]
        },
        {
          id: 'demo-3',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1551048632-dae6bb2ba579?w=800',
          title: 'Business Casual',
          memoryNote: 'First day at new job 💼',
          tags: ['business', 'professional'],
          dateAdded: new Date('2024-03-10'),
          visibility: 'public',
          postedAt: new Date('2024-03-10'),
          scheduledDay: null,
          mediaType: 'photo'
        },
        {
          id: 'demo-4',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
          title: 'Street Style Vibes',
          memoryNote: 'Downtown shopping day 🛍️',
          tags: ['streetwear', 'casual', 'trendy'],
          dateAdded: new Date('2024-03-15'),
          visibility: 'public',
          postedAt: new Date('2024-03-15'),
          scheduledDay: null,
          mediaType: 'photo'
        },
        {
          id: 'demo-5',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
          title: 'Elegant Evening Look',
          memoryNote: 'Dinner with friends ✨',
          tags: ['elegant', 'evening', 'dressy'],
          dateAdded: new Date('2024-03-22'),
          visibility: 'public',
          postedAt: new Date('2024-03-22'),
          scheduledDay: null,
          mediaType: 'photo',
          clothingLinks: [
            { name: 'Black Midi Dress', url: 'https://example.com/black-dress' },
            { name: 'Gold Accessories', url: 'https://example.com/accessories' }
          ]
        },
        {
          id: 'demo-6',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
          title: 'Weekend Casual',
          memoryNote: 'Coffee run outfit ☕',
          tags: ['casual', 'weekend', 'comfy'],
          dateAdded: new Date('2024-04-01'),
          visibility: 'public',
          postedAt: new Date('2024-04-01'),
          scheduledDay: null,
          mediaType: 'photo'
        },
        {
          id: 'demo-7',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
          title: 'Spring Florals',
          memoryNote: 'Garden party ready 🌸',
          tags: ['spring', 'floral', 'feminine'],
          dateAdded: new Date('2024-04-10'),
          visibility: 'public',
          postedAt: new Date('2024-04-10'),
          scheduledDay: null,
          mediaType: 'photo'
        },
        {
          id: 'demo-8',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
          title: 'Athleisure Style',
          memoryNote: 'Gym to brunch 💪',
          tags: ['athleisure', 'sporty', 'active'],
          dateAdded: new Date('2024-04-18'),
          visibility: 'public',
          postedAt: new Date('2024-04-18'),
          scheduledDay: null,
          mediaType: 'photo'
        },
        {
          id: 'demo-9',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800',
          title: 'Denim Days',
          memoryNote: 'Classic never goes out of style 👖',
          tags: ['denim', 'classic', 'casual'],
          dateAdded: new Date('2024-04-25'),
          visibility: 'public',
          postedAt: new Date('2024-04-25'),
          scheduledDay: null,
          mediaType: 'photo',
          clothingLinks: [
            { name: 'Vintage Denim Jacket', url: 'https://example.com/denim-jacket' }
          ]
        },
        {
          id: 'demo-10',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800',
          title: 'Bohemian Rhapsody',
          memoryNote: 'Festival ready 🎪',
          tags: ['boho', 'festival', 'free-spirited'],
          dateAdded: new Date('2024-05-05'),
          visibility: 'public',
          postedAt: new Date('2024-05-05'),
          scheduledDay: null,
          mediaType: 'photo'
        },
        {
          id: 'demo-11',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
          title: 'Minimalist Chic',
          memoryNote: 'Less is more ⚪',
          tags: ['minimalist', 'chic', 'modern'],
          dateAdded: new Date('2024-05-12'),
          visibility: 'public',
          postedAt: new Date('2024-05-12'),
          scheduledDay: null,
          mediaType: 'photo'
        },
        {
          id: 'demo-12',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=800',
          title: 'Vintage Vibes',
          memoryNote: 'Thrifted treasures 🕰️',
          tags: ['vintage', 'retro', 'unique'],
          dateAdded: new Date('2024-05-20'),
          visibility: 'public',
          postedAt: new Date('2024-05-20'),
          scheduledDay: null,
          mediaType: 'photo'
        },
        {
          id: 'demo-13',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800',
          title: 'Power Suit',
          memoryNote: 'Boss meeting outfit 👔',
          tags: ['professional', 'power', 'formal'],
          dateAdded: new Date('2024-05-28'),
          visibility: 'public',
          postedAt: new Date('2024-05-28'),
          scheduledDay: null,
          mediaType: 'photo',
          clothingLinks: [
            { name: 'Tailored Blazer', url: 'https://example.com/blazer' }
          ]
        },
        {
          id: 'demo-14',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800',
          title: 'Cozy Knits',
          memoryNote: 'Perfect for fall weather 🍂',
          tags: ['fall', 'cozy', 'knitwear'],
          dateAdded: new Date('2024-06-05'),
          visibility: 'public',
          postedAt: new Date('2024-06-05'),
          scheduledDay: null,
          mediaType: 'photo'
        },
        {
          id: 'demo-15',
          userId: 'demo-user',
          photoURL: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=800',
          title: 'Date Night Ready',
          memoryNote: 'Dinner and a movie 🌹',
          tags: ['date', 'romantic', 'dressy'],
          dateAdded: new Date('2024-06-15'),
          visibility: 'public',
          postedAt: new Date('2024-06-15'),
          scheduledDay: null,
          mediaType: 'photo'
        }
      ];
      res.json(demoItems);
    } catch (error) {
      console.error("Error fetching demo items:", error);
      res.status(500).json({ error: "Failed to fetch demo items" });
    }
  });

  // Demo polls endpoint for trial users
  app.get('/api/demo/polls', async (req, res) => {
    try {
      // Return demo polls for trial users
      const demoPolls = [
        {
          id: 'demo-poll-1',
          userId: 'demo-user',
          title: 'Which outfit for my date night? 🌹',
          itemIds: ['demo-2', 'demo-5', 'demo-15'],
          shareLink: 'demo-poll-1',
          createdAt: new Date('2024-06-10'),
          votes: [
            { itemId: 'demo-5', voterIdentifier: 'voter-1' },
            { itemId: 'demo-5', voterIdentifier: 'voter-2' },
            { itemId: 'demo-15', voterIdentifier: 'voter-3' },
            { itemId: 'demo-5', voterIdentifier: 'voter-4' },
            { itemId: 'demo-2', voterIdentifier: 'voter-5' }
          ]
        },
        {
          id: 'demo-poll-2',
          userId: 'demo-user',
          title: 'Best weekend casual look? ☕',
          itemIds: ['demo-1', 'demo-6', 'demo-8'],
          shareLink: 'demo-poll-2',
          createdAt: new Date('2024-05-25'),
          votes: [
            { itemId: 'demo-6', voterIdentifier: 'voter-1' },
            { itemId: 'demo-6', voterIdentifier: 'voter-2' },
            { itemId: 'demo-1', voterIdentifier: 'voter-3' },
            { itemId: 'demo-8', voterIdentifier: 'voter-4' }
          ]
        },
        {
          id: 'demo-poll-3',
          userId: 'demo-user',
          title: 'Interview outfit help! 💼',
          itemIds: ['demo-3', 'demo-13'],
          shareLink: 'demo-poll-3',
          createdAt: new Date('2024-04-15'),
          votes: [
            { itemId: 'demo-13', voterIdentifier: 'voter-1' },
            { itemId: 'demo-13', voterIdentifier: 'voter-2' },
            { itemId: 'demo-13', voterIdentifier: 'voter-3' },
            { itemId: 'demo-3', voterIdentifier: 'voter-4' },
            { itemId: 'demo-13', voterIdentifier: 'voter-5' },
            { itemId: 'demo-13', voterIdentifier: 'voter-6' }
          ]
        }
      ];
      res.json(demoPolls);
    } catch (error) {
      console.error("Error fetching demo polls:", error);
      res.status(500).json({ error: "Failed to fetch demo polls" });
    }
  });

  // Public feed route for paginated outfit browsing (TikTok-style)
  app.get('/api/public/items', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const cursor = req.query.cursor as string;
      
      // Validate limit
      if (limit < 1 || limit > 50) {
        return res.status(400).json({ error: "Limit must be between 1 and 50" });
      }

      const result = await storage.listPublicItemsPaginated(limit, cursor);
      
      // Demo video item to showcase the video feature
      const demoVideoItem = {
        id: 'demo-video-1',
        userId: 'demo-user',
        photoURL: 'https://videos.pexels.com/video-files/5721060/5721060-hd_1080_1920_25fps.mp4',
        title: 'Street Style OOTD',
        memoryNote: 'Loving this casual street look! 👟✨ Tap the speaker to hear the vibe!',
        tags: ['streetwear', 'ootd', 'casual'],
        dateAdded: new Date('2024-12-22'),
        visibility: 'public',
        postedAt: new Date('2024-12-22'),
        scheduledDay: null,
        mediaType: 'video',
        clothingLinks: [
          { name: 'Casual Jacket', url: 'https://example.com/jacket' }
        ],
        category: 'TOPS' as const,
        subCategory: 'jacket',
        confidence: 90,
        classificationSource: 'AI',
        createdAt: new Date('2024-12-22'),
        updatedAt: new Date('2024-12-22')
      };
      
      // Always include demo video at the start (only on first page)
      if (!cursor) {
        result.items = [demoVideoItem, ...result.items];
      }
      
      // If no public items exist (like in trial mode), fallback to demo items
      if (result.items.length <= 1 && !cursor) {
        const demoItems = [
          demoVideoItem,
          {
            id: 'demo-1',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
            title: 'Cozy Winter Sweater',
            memoryNote: 'Perfect for chilly days ❄️',
            tags: ['winter', 'cozy', 'casual'],
            dateAdded: new Date('2024-01-15'),
            visibility: 'public',
            postedAt: new Date('2024-01-15'),
            scheduledDay: null,
            mediaType: 'photo'
          },
          {
            id: 'demo-2',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
            title: 'Summer Dress',
            memoryNote: 'Wore this to the beach party 🏖️',
            tags: ['summer', 'dress', 'party'],
            dateAdded: new Date('2024-02-20'),
            visibility: 'public',
            postedAt: new Date('2024-02-20'),
            scheduledDay: null,
            mediaType: 'photo',
            clothingLinks: [
              { name: 'White Summer Dress', url: 'https://example.com/dress' }
            ]
          },
          {
            id: 'demo-3',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1551048632-dae6bb2ba579?w=800',
            title: 'Business Casual',
            memoryNote: 'First day at new job 💼',
            tags: ['business', 'professional'],
            dateAdded: new Date('2024-03-10'),
            visibility: 'public',
            postedAt: new Date('2024-03-10'),
            scheduledDay: null,
            mediaType: 'photo'
          },
          {
            id: 'demo-4',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
            title: 'Street Style Vibes',
            memoryNote: 'Downtown shopping day 🛍️',
            tags: ['streetwear', 'casual', 'trendy'],
            dateAdded: new Date('2024-03-15'),
            visibility: 'public',
            postedAt: new Date('2024-03-15'),
            scheduledDay: null,
            mediaType: 'photo'
          },
          {
            id: 'demo-5',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
            title: 'Elegant Evening Look',
            memoryNote: 'Dinner with friends ✨',
            tags: ['elegant', 'evening', 'dressy'],
            dateAdded: new Date('2024-03-22'),
            visibility: 'public',
            postedAt: new Date('2024-03-22'),
            scheduledDay: null,
            mediaType: 'photo',
            clothingLinks: [
              { name: 'Black Midi Dress', url: 'https://example.com/black-dress' },
              { name: 'Gold Accessories', url: 'https://example.com/accessories' }
            ]
          },
          {
            id: 'demo-6',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
            title: 'Weekend Casual',
            memoryNote: 'Coffee run outfit ☕',
            tags: ['casual', 'weekend', 'comfy'],
            dateAdded: new Date('2024-04-01'),
            visibility: 'public',
            postedAt: new Date('2024-04-01'),
            scheduledDay: null,
            mediaType: 'photo'
          },
          {
            id: 'demo-7',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
            title: 'Spring Florals',
            memoryNote: 'Garden party ready 🌸',
            tags: ['spring', 'floral', 'feminine'],
            dateAdded: new Date('2024-04-10'),
            visibility: 'public',
            postedAt: new Date('2024-04-10'),
            scheduledDay: null,
            mediaType: 'photo'
          },
          {
            id: 'demo-8',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
            title: 'Athleisure Style',
            memoryNote: 'Gym to brunch 💪',
            tags: ['athleisure', 'sporty', 'active'],
            dateAdded: new Date('2024-04-18'),
            visibility: 'public',
            postedAt: new Date('2024-04-18'),
            scheduledDay: null,
            mediaType: 'photo'
          },
          {
            id: 'demo-9',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800',
            title: 'Denim Days',
            memoryNote: 'Classic never goes out of style 👖',
            tags: ['denim', 'classic', 'casual'],
            dateAdded: new Date('2024-04-25'),
            visibility: 'public',
            postedAt: new Date('2024-04-25'),
            scheduledDay: null,
            mediaType: 'photo',
            clothingLinks: [
              { name: 'Vintage Denim Jacket', url: 'https://example.com/denim-jacket' }
            ]
          },
          {
            id: 'demo-10',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800',
            title: 'Bohemian Rhapsody',
            memoryNote: 'Festival ready 🎪',
            tags: ['boho', 'festival', 'free-spirited'],
            dateAdded: new Date('2024-05-05'),
            visibility: 'public',
            postedAt: new Date('2024-05-05'),
            scheduledDay: null,
            mediaType: 'photo'
          },
          {
            id: 'demo-11',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
            title: 'Minimalist Chic',
            memoryNote: 'Less is more ⚪',
            tags: ['minimalist', 'chic', 'modern'],
            dateAdded: new Date('2024-05-12'),
            visibility: 'public',
            postedAt: new Date('2024-05-12'),
            scheduledDay: null,
            mediaType: 'photo'
          },
          {
            id: 'demo-12',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=800',
            title: 'Vintage Vibes',
            memoryNote: 'Thrifted treasures 🕰️',
            tags: ['vintage', 'retro', 'unique'],
            dateAdded: new Date('2024-05-20'),
            visibility: 'public',
            postedAt: new Date('2024-05-20'),
            scheduledDay: null,
            mediaType: 'photo'
          },
          {
            id: 'demo-13',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800',
            title: 'Power Suit',
            memoryNote: 'Boss meeting outfit 👔',
            tags: ['professional', 'power', 'formal'],
            dateAdded: new Date('2024-05-28'),
            visibility: 'public',
            postedAt: new Date('2024-05-28'),
            scheduledDay: null,
            mediaType: 'photo',
            clothingLinks: [
              { name: 'Tailored Blazer', url: 'https://example.com/blazer' }
            ]
          },
          {
            id: 'demo-14',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800',
            title: 'Cozy Knits',
            memoryNote: 'Perfect for fall weather 🍂',
            tags: ['fall', 'cozy', 'knitwear'],
            dateAdded: new Date('2024-06-05'),
            visibility: 'public',
            postedAt: new Date('2024-06-05'),
            scheduledDay: null,
            mediaType: 'photo'
          },
          {
            id: 'demo-15',
            userId: 'demo-user',
            photoURL: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=800',
            title: 'Date Night Ready',
            memoryNote: 'Dinner and a movie 🌹',
            tags: ['date', 'romantic', 'dressy'],
            dateAdded: new Date('2024-06-15'),
            visibility: 'public',
            postedAt: new Date('2024-06-15'),
            scheduledDay: null,
            mediaType: 'photo'
          }
        ];
        
        return res.json({ items: demoItems.slice(0, limit), nextCursor: undefined });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching public items:", error);
      res.status(500).json({ error: "Failed to fetch public items" });
    }
  });

  // Public file serving endpoint
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Object serving endpoint (for uploaded outfit photos)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      return res.status(404).json({ error: "File not found" });
    }
  });

  // Get upload URL for outfit photos
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Items endpoints
  app.get("/api/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const items = await storage.getItemsByUserId(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.post("/api/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertItemSchema.parse(req.body);
      
      // Normalize the photo URL
      const normalizedPhotoURL = objectStorageService.normalizeObjectEntityPath(validatedData.photoURL);
      
      // If no category provided, run AI classification
      let category = validatedData.category;
      let subCategory = validatedData.subCategory;
      let confidence: number | undefined;
      let classificationSource: "AI" | "USER" | undefined;
      
      if (!validatedData.category || validatedData.category === "TOPS") {
        try {
          // Run AI classification on the image
          const classification = await classifyClothingImage(normalizedPhotoURL);
          category = classification.category;
          subCategory = classification.subCategory || subCategory;
          confidence = classification.confidence;
          classificationSource = "AI";
          
          // Log classification for debugging
          console.log(`AI classified image as ${category} (${confidence}% confidence)`);
        } catch (classifyError) {
          console.error("Classification failed, defaulting to TOPS:", classifyError);
          category = "TOPS";
          confidence = 30;
          classificationSource = "AI";
        }
      } else {
        // User explicitly set category
        classificationSource = "USER";
        confidence = 100;
      }
      
      const item = await storage.createItem({
        ...validatedData,
        userId,
        photoURL: normalizedPhotoURL,
        category,
        subCategory,
        confidence,
        classificationSource
      });
      
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  app.get("/api/items/:id", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  // Delete item/post
  // Update item category
  app.patch("/api/items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { category, subCategory } = req.body;
      
      // Check ownership
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      if (item.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this item" });
      }
      
      const updated = await storage.updateItem(req.params.id, {
        category,
        subCategory,
        classificationSource: "USER",
        confidence: 100,
        updatedAt: new Date()
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // Bulk update item categories
  app.patch("/api/items/bulk/category", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { itemIds, category } = req.body;
      
      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ error: "itemIds must be a non-empty array" });
      }
      
      const results = await Promise.all(
        itemIds.map(async (id: string) => {
          const item = await storage.getItem(id);
          if (!item || item.userId !== userId) return null;
          return storage.updateItem(id, {
            category,
            classificationSource: "USER",
            confidence: 100,
            updatedAt: new Date()
          });
        })
      );
      
      const updated = results.filter(Boolean);
      res.json({ updated: updated.length, items: updated });
    } catch (error) {
      console.error("Error bulk updating items:", error);
      res.status(500).json({ error: "Failed to bulk update items" });
    }
  });

  app.delete("/api/items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check ownership - fetch item first to verify user owns it
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Verify ownership
      if (item.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this item" });
      }
      
      const deleted = await storage.deleteItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // Update item posted timestamp (for social posting)
  app.patch("/api/items/:id/post", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check ownership first
      const existingItem = await storage.getItem(req.params.id);
      if (!existingItem) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      if (existingItem.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this item" });
      }
      
      const item = await storage.updateItem(req.params.id, {
        postedAt: new Date()
      });
      res.json(item);
    } catch (error) {
      console.error("Error updating item posted timestamp:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // Get social feed (outfits from friends)
  app.get("/api/feed", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      // Get user's friends
      const friends = await storage.listFriends(userId);
      const friendIds = friends.map(f => f.friendId);

      // Get all items from friends that have been posted (visibility is friends or public and postedAt is not null)
      const allItems = await Promise.all(
        friendIds.map(friendId => storage.getItemsByUserId(friendId))
      );

      const socialFeedItems = allItems
        .flat()
        .filter(item => 
          item.postedAt && 
          (item.visibility === "friends" || item.visibility === "public")
        )
        .sort((a, b) => 
          new Date(b.postedAt!).getTime() - new Date(a.postedAt!).getTime()
        );

      res.json(socialFeedItems);
    } catch (error) {
      console.error("Error fetching social feed:", error);
      res.status(500).json({ error: "Failed to fetch social feed" });
    }
  });

  // Polls endpoints
  app.get("/api/polls", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const polls = await storage.getPollsByUserId(userId);
      res.json(polls);
    } catch (error) {
      console.error("Error fetching polls:", error);
      res.status(500).json({ error: "Failed to fetch polls" });
    }
  });

  app.post("/api/polls", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertPollSchema.parse(req.body);
      
      // Verify all items exist and belong to the user
      for (const itemId of validatedData.itemIds) {
        const item = await storage.getItem(itemId);
        if (!item || item.userId !== userId) {
          return res.status(400).json({ error: `Invalid item ID: ${itemId}` });
        }
      }
      
      const poll = await storage.createPoll({
        ...validatedData,
        userId
      });
      res.status(201).json(poll);
    } catch (error) {
      console.error("Error creating poll:", error);
      res.status(500).json({ error: "Failed to create poll" });
    }
  });

  app.get("/api/polls/:shareLink", async (req, res) => {
    try {
      const poll = await storage.getPollByShareLink(req.params.shareLink);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      
      // Get the items for this poll
      const items = await Promise.all(
        poll.itemIds.map(id => storage.getItem(id))
      );
      
      // Get vote counts
      const votes = await storage.getPollVotes(poll.id);
      const voteCounts = poll.itemIds.reduce((acc, itemId) => {
        acc[itemId] = votes.filter(vote => vote.selectedItemId === itemId).length;
        return acc;
      }, {} as Record<string, number>);
      
      res.json({
        ...poll,
        items: items.filter(Boolean),
        voteCounts,
        totalVotes: votes.length
      });
    } catch (error) {
      console.error("Error fetching poll:", error);
      res.status(500).json({ error: "Failed to fetch poll" });
    }
  });

  // Poll voting
  app.post("/api/polls/:shareLink/vote", async (req, res) => {
    try {
      const poll = await storage.getPollByShareLink(req.params.shareLink);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      
      const voterIdentifier = req.ip || req.headers['x-forwarded-for'] as string || 'anonymous';
      const { selectedItemId } = req.body;
      
      if (!poll.itemIds.includes(selectedItemId)) {
        return res.status(400).json({ error: "Invalid item selection" });
      }
      
      // Check if user already voted
      const existingVote = await storage.getVoteByPollAndVoter(poll.id, voterIdentifier);
      if (existingVote) {
        return res.status(400).json({ error: "You have already voted in this poll" });
      }
      
      const vote = await storage.createPollVote({
        pollId: poll.id,
        voterIdentifier,
        selectedItemId
      });
      
      res.status(201).json(vote);
    } catch (error) {
      console.error("Error submitting vote:", error);
      res.status(500).json({ error: "Failed to submit vote" });
    }
  });

  // Outfit suggestion endpoint
  app.post("/api/suggest-outfit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const items = await storage.getItemsByUserId(userId);
      const formattedItems = items.map(item => ({
        id: item.id,
        memoryNote: item.memoryNote || undefined,
        tags: item.tags || [],
        dateAdded: item.dateAdded,
        category: item.category,
        subCategory: item.subCategory
      }));
      const suggestion = await generateOutfitSuggestion(formattedItems);
      
      // Create a map of item IDs to their full details for quick lookup
      const itemMap = new Map(items.map(item => [item.id, item]));
      
      // Enrich suggestions with full item details including photoURLs
      const enrichedSuggestions = suggestion.suggestions.map(s => ({
        ...s,
        items: s.itemIds.map(id => itemMap.get(id)).filter(Boolean)
      }));
      
      res.json({
        ...suggestion,
        suggestions: enrichedSuggestions
      });
    } catch (error) {
      console.error("Error generating outfit suggestion:", error);
      res.status(500).json({ error: "Failed to generate outfit suggestion" });
    }
  });

  // Search users endpoint
  app.get("/api/users/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const excludeUserId = req.query.excludeUserId as string;
      
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ error: "Query must be at least 2 characters" });
      }
      
      const users = await storage.searchUsers(query, excludeUserId);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Friends endpoints
  app.get("/api/friends", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const userExists = await ensureUserExists(userId);
      if (!userExists) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const friends = await storage.listFriends(userId);
      
      // Get user details for each friend
      const friendsWithDetails = await Promise.all(
        friends.map(async (friend) => {
          const userDetails = await storage.getUser(friend.friendId);
          return {
            ...friend,
            displayName: userDetails ? `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim() || userDetails.email || "Unknown" : "Unknown"
          };
        })
      );
      
      res.json(friendsWithDetails);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  });

  app.get("/api/friend-requests", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const type = req.query.type as string;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      if (!type || !["incoming", "outgoing"].includes(type)) {
        return res.status(400).json({ error: "type must be 'incoming' or 'outgoing'" });
      }
      
      const userExists = await ensureUserExists(userId);
      if (!userExists) {
        return res.status(404).json({ error: "User not found" });
      }
      
      let requests;
      if (type === "incoming") {
        requests = await storage.getIncomingRequests(userId);
      } else {
        requests = await storage.getOutgoingRequests(userId);
      }
      
      // Get user details for each request
      const requestsWithDetails = await Promise.all(
        requests.map(async (request) => {
          const fromUser = await storage.getUser(request.fromUserId);
          const toUser = await storage.getUser(request.toUserId);
          return {
            ...request,
            fromDisplayName: fromUser ? `${fromUser.firstName || ''} ${fromUser.lastName || ''}`.trim() || fromUser.email || "Unknown" : "Unknown",
            toDisplayName: toUser ? `${toUser.firstName || ''} ${toUser.lastName || ''}`.trim() || toUser.email || "Unknown" : "Unknown"
          };
        })
      );
      
      res.json(requestsWithDetails);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ error: "Failed to fetch friend requests" });
    }
  });

  app.post("/api/friend-requests", async (req, res) => {
    try {
      const validatedData = insertFriendRequestSchema.parse(req.body);
      
      // Validate both users exist
      const fromUserExists = await ensureUserExists(validatedData.fromUserId);
      const toUserExists = await ensureUserExists(validatedData.toUserId);
      
      if (!fromUserExists) {
        return res.status(404).json({ error: "From user not found" });
      }
      
      if (!toUserExists) {
        return res.status(404).json({ error: "To user not found" });
      }
      
      const friendRequest = await storage.createFriendRequest(
        validatedData.fromUserId,
        validatedData.toUserId
      );
      
      if (!friendRequest) {
        return res.status(409).json({ error: "Friend request already exists or users are already friends" });
      }
      
      res.status(201).json(friendRequest);
    } catch (error) {
      console.error("Error creating friend request:", error);
      res.status(500).json({ error: "Failed to create friend request" });
    }
  });

  app.post("/api/friend-requests/:id/accept", async (req, res) => {
    try {
      const requestId = req.params.id;
      
      const success = await storage.respondToFriendRequest(requestId, "accept");
      
      if (!success) {
        return res.status(404).json({ error: "Friend request not found or already processed" });
      }
      
      res.json({ message: "Friend request accepted" });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ error: "Failed to accept friend request" });
    }
  });

  app.post("/api/friend-requests/:id/decline", async (req, res) => {
    try {
      const requestId = req.params.id;
      
      const success = await storage.respondToFriendRequest(requestId, "decline");
      
      if (!success) {
        return res.status(404).json({ error: "Friend request not found or already processed" });
      }
      
      res.json({ message: "Friend request declined" });
    } catch (error) {
      console.error("Error declining friend request:", error);
      res.status(500).json({ error: "Failed to decline friend request" });
    }
  });

  app.delete("/api/friends/:friendId", async (req, res) => {
    try {
      const friendId = req.params.friendId;
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const userExists = await ensureUserExists(userId);
      const friendExists = await ensureUserExists(friendId);
      
      if (!userExists) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!friendExists) {
        return res.status(404).json({ error: "Friend not found" });
      }
      
      const success = await storage.removeFriend(userId, friendId);
      
      if (!success) {
        return res.status(404).json({ error: "Friendship not found" });
      }
      
      res.json({ message: "Friend removed successfully" });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ error: "Failed to remove friend" });
    }
  });

  // Wishlist routes
  app.get("/api/wishlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const items = await storage.getWishlistItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/wishlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertWishlistItemSchema.parse({
        ...req.body,
        userId
      });
      const item = await storage.createWishlistItem(validatedData);
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Error creating wishlist item:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid wishlist item data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add item to wishlist" });
    }
  });

  app.delete("/api/wishlist/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemId = req.params.id;
      const success = await storage.deleteWishlistItem(itemId, userId);
      if (!success) {
        return res.status(404).json({ error: "Wishlist item not found" });
      }
      res.json({ message: "Item removed from wishlist" });
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
      res.status(500).json({ error: "Failed to remove item from wishlist" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
