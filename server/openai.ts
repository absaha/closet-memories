import OpenAI from "openai";
import type { ItemCategory } from "@shared/schema";
import { ITEM_CATEGORIES } from "@shared/schema";

// Use Replit AI Integrations for OpenAI access
const openai = new OpenAI({ 
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "dummy-key",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
});

export interface ClassificationResult {
  category: ItemCategory;
  subCategory: string | null;
  confidence: number; // 0-100
}

export async function classifyClothingImage(imageUrl: string): Promise<ClassificationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a clothing classification expert. Analyze the image and classify the primary clothing item into one of these categories: ${ITEM_CATEGORIES.join(", ")}.

Respond with JSON in this exact format:
{
  "category": "TOPS" | "BOTTOMS" | "DRESSES" | "SHOES" | "ACCESSORIES",
  "subCategory": "specific type like hoodie, jeans, sneakers, etc.",
  "confidence": 0-100
}

Rules:
- TOPS: shirts, t-shirts, blouses, sweaters, hoodies, jackets, coats
- BOTTOMS: pants, jeans, shorts, skirts, leggings
- DRESSES: dresses, jumpsuits, rompers, gowns
- SHOES: sneakers, heels, boots, sandals, flats
- ACCESSORIES: bags, jewelry, hats, belts, scarves, sunglasses

If the image is unclear or contains multiple items, classify the most prominent one. If unsure, use TOPS with lower confidence.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Classify this clothing item:"
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 200
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate and normalize the result
    const category = ITEM_CATEGORIES.includes(result.category) 
      ? result.category as ItemCategory 
      : "TOPS";
    const confidence = Math.min(100, Math.max(0, parseInt(result.confidence) || 50));
    
    return {
      category,
      subCategory: result.subCategory || null,
      confidence
    };
  } catch (error) {
    console.error("Error classifying clothing image:", error);
    // Fallback to TOPS with low confidence
    return {
      category: "TOPS",
      subCategory: null,
      confidence: 30
    };
  }
}

export interface OutfitSuggestion {
  title: string;
  description: string;
  suggestions: Array<{
    option: number;
    itemIds: string[];
    description: string;
    reasoning: string;
  }>;
  nudges?: string[]; // Suggestions to complete the wardrobe
}

export interface CategoryItem {
  id: string;
  category: ItemCategory;
  memoryNote?: string;
  tags: string[];
  subCategory?: string | null;
}

export async function generateOutfitSuggestion(
  userItems: Array<{ id: string; memoryNote?: string; tags: string[]; dateAdded: Date; category?: ItemCategory; subCategory?: string | null }>,
  todayDate: string = new Date().toLocaleDateString()
): Promise<OutfitSuggestion> {
  // Group items by category
  const itemsByCategory: Record<ItemCategory, typeof userItems> = {
    TOPS: [],
    BOTTOMS: [],
    DRESSES: [],
    SHOES: [],
    ACCESSORIES: []
  };
  
  userItems.forEach(item => {
    const cat = item.category || "TOPS";
    if (itemsByCategory[cat]) {
      itemsByCategory[cat].push(item);
    }
  });

  // Check what categories are missing for nudges
  const nudges: string[] = [];
  const hasTops = itemsByCategory.TOPS.length > 0;
  const hasBottoms = itemsByCategory.BOTTOMS.length > 0;
  const hasDresses = itemsByCategory.DRESSES.length > 0;
  const hasShoes = itemsByCategory.SHOES.length > 0;
  const hasAccessories = itemsByCategory.ACCESSORIES.length > 0;

  // Determine if we can make a complete outfit
  const canMakeTopBottomOutfit = hasTops && hasBottoms;
  const canMakeDressOutfit = hasDresses;
  const canMakeAnyOutfit = canMakeTopBottomOutfit || canMakeDressOutfit;

  // Generate nudges for missing categories
  if (!hasTops && !hasDresses) {
    nudges.push("Add some tops or dresses to create complete outfits! 👕");
  }
  if (!hasBottoms && !hasDresses) {
    nudges.push("Add some bottoms (jeans, skirts, pants) to mix and match! 👖");
  }
  if (!hasShoes) {
    nudges.push("Add your favorite shoes to complete your looks! 👟");
  }
  if (!hasAccessories && (canMakeAnyOutfit || userItems.length > 3)) {
    nudges.push("Accessories can elevate any outfit - add some! ✨");
  }

  // If no items at all, return early with helpful message
  if (userItems.length === 0) {
    return {
      title: "Let's build your closet! 📸",
      description: "Add some pieces to your closet and I'll help you create amazing outfits!",
      suggestions: [],
      nudges: ["Start by adding photos of your favorite tops, bottoms, or dresses!"]
    };
  }

  // If can't make a proper outfit, suggest what they have with nudges
  if (!canMakeAnyOutfit) {
    const availableItems = userItems.slice(0, 2).map(item => item.id);
    return {
      title: "Almost there! 🌟",
      description: "Add a few more pieces to unlock outfit suggestions!",
      suggestions: availableItems.length > 0 ? [{
        option: 1,
        itemIds: availableItems,
        description: "Your current pieces",
        reasoning: "Great start! Add matching pieces to create full outfits."
      }] : [],
      nudges
    };
  }

  try {
    // Build category-aware item descriptions
    const formatItems = (items: typeof userItems, category: string) => 
      items.map(item => 
        `  ID: "${item.id}" - ${item.subCategory || category} - ${item.memoryNote || 'No description'} (Tags: ${item.tags.join(', ') || 'none'})`
      ).join('\n');

    let itemDescriptions = "";
    if (hasTops) itemDescriptions += `TOPS:\n${formatItems(itemsByCategory.TOPS, 'top')}\n\n`;
    if (hasBottoms) itemDescriptions += `BOTTOMS:\n${formatItems(itemsByCategory.BOTTOMS, 'bottom')}\n\n`;
    if (hasDresses) itemDescriptions += `DRESSES:\n${formatItems(itemsByCategory.DRESSES, 'dress')}\n\n`;
    if (hasShoes) itemDescriptions += `SHOES:\n${formatItems(itemsByCategory.SHOES, 'shoes')}\n\n`;
    if (hasAccessories) itemDescriptions += `ACCESSORIES:\n${formatItems(itemsByCategory.ACCESSORIES, 'accessory')}\n\n`;

    const shoesNote = hasShoes 
      ? "Include shoes when they complement the outfit well."
      : "Note: User hasn't added shoes yet - suggest outfits without shoes.";
    
    const accessoriesNote = hasAccessories
      ? "Optionally include accessories if they enhance the look."
      : "";

    const prompt = `You are a fun, teen-friendly fashion assistant for "Closet Memories" app.

Today's date: ${todayDate}

WARDROBE INVENTORY BY CATEGORY:
${itemDescriptions}

OUTFIT BUILDING RULES:
1. Each outfit MUST have: (1 TOP + 1 BOTTOM) OR (1 DRESS)
2. ${shoesNote}
3. ${accessoriesNote}
4. Pick items that complement each other in style/color based on their descriptions and tags.

Create 1-2 outfit combinations. Be encouraging, fun, and use teen-friendly language with emojis!

Respond with JSON:
{
  "title": "Fun title for today's suggestions",
  "description": "Friendly 1-2 sentence intro",
  "suggestions": [
    {
      "option": 1,
      "itemIds": ["exact-id-1", "exact-id-2"],
      "description": "Brief outfit name",
      "reasoning": "Why this works"
    }
  ]
}

CRITICAL: Use EXACT IDs from the list above. Each suggestion must follow the outfit rules.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful fashion assistant that creates outfit suggestions following specific rules. Always be encouraging and teen-friendly. Return valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate that returned itemIds actually exist in userItems
    const validItemIds = new Set(userItems.map(item => item.id));
    const validatedSuggestions = (result.suggestions || []).map((suggestion: any, index: number) => ({
      option: suggestion.option || index + 1,
      itemIds: (suggestion.itemIds || []).filter((id: string) => validItemIds.has(id)),
      description: suggestion.description || "Outfit combo",
      reasoning: suggestion.reasoning || "This looks great!"
    })).filter((s: any) => s.itemIds.length > 0);

    // If AI didn't return valid suggestions, create a fallback based on rules
    if (validatedSuggestions.length === 0) {
      const fallbackOutfit = createFallbackOutfit(itemsByCategory);
      if (fallbackOutfit.length > 0) {
        validatedSuggestions.push({
          option: 1,
          itemIds: fallbackOutfit,
          description: "Today's pick",
          reasoning: "A great combination from your closet!"
        });
      }
    }

    return {
      title: result.title || "Perfect for today! ✨",
      description: result.description || "You'll look amazing in these combinations!",
      suggestions: validatedSuggestions,
      nudges: nudges.length > 0 ? nudges : undefined
    };
  } catch (error) {
    console.error("Error generating outfit suggestion:", error);
    
    // Fallback suggestion using proper outfit rules
    const fallbackOutfit = createFallbackOutfit(itemsByCategory);
    
    return {
      title: "You've got great style! ✨",
      description: "Here's an outfit that would look amazing today!",
      suggestions: fallbackOutfit.length > 0 ? [{
        option: 1,
        itemIds: fallbackOutfit,
        description: "Today's suggested look",
        reasoning: "These pieces from your closet go great together!"
      }] : [],
      nudges: nudges.length > 0 ? nudges : undefined
    };
  }
}

// Helper function to create a valid outfit from available items
function createFallbackOutfit(itemsByCategory: Record<ItemCategory, Array<{ id: string }>>): string[] {
  const outfit: string[] = [];
  
  // Try dress first
  if (itemsByCategory.DRESSES.length > 0) {
    outfit.push(itemsByCategory.DRESSES[0].id);
  } else {
    // Try top + bottom
    if (itemsByCategory.TOPS.length > 0) {
      outfit.push(itemsByCategory.TOPS[0].id);
    }
    if (itemsByCategory.BOTTOMS.length > 0) {
      outfit.push(itemsByCategory.BOTTOMS[0].id);
    }
  }
  
  // Add shoes if available (optional but recommended)
  if (itemsByCategory.SHOES.length > 0 && outfit.length > 0) {
    outfit.push(itemsByCategory.SHOES[0].id);
  }
  
  // Add accessory if available (optional)
  if (itemsByCategory.ACCESSORIES.length > 0 && outfit.length >= 2) {
    outfit.push(itemsByCategory.ACCESSORIES[0].id);
  }
  
  return outfit;
}

export async function generatePollCaption(outfitDescriptions: string[]): Promise<string> {
  try {
    const prompt = `Create a fun, teen-friendly caption for a fashion poll with these outfit options:
${outfitDescriptions.map((desc, i) => `Option ${i + 1}: ${desc}`).join('\n')}

Make it engaging, use emojis, and encourage friends to vote. Keep it short (1-2 sentences max).`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a fun social media caption writer for teens. Create engaging poll captions with emojis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150
    });

    return response.choices[0].message.content || "Help me pick my outfit! ✨";
  } catch (error) {
    console.error("Error generating poll caption:", error);
    return "Help me choose my outfit! ✨";
  }
}
