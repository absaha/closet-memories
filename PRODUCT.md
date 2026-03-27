# Closet Memories - Product Guide

## What is Closet Memories?

Closet Memories is a fashion-focused web application that turns your physical wardrobe into a digital, interactive experience. Users photograph or record their outfits, organize them by category, get AI-powered style suggestions, create polls for friends to vote on, and discover trending looks through a public feed.

The core idea: **your closet is more than clothes — it's memories, moments, and self-expression.** Every outfit has a story, and Closet Memories helps you capture, organize, and share those stories.

---

## Who is it for?

The primary audience is **teens and young adults** (14-25) who:
- Take outfit photos regularly but have no organized way to store them
- Want friends' opinions before going out ("Which one should I wear?")
- Follow fashion trends and want to share their own style
- Want to remember what they wore to specific events
- Discover new outfit ideas from others

---

## The Problem

1. **Outfit photos are scattered** across camera rolls, social media, and messaging apps with no organization
2. **"What should I wear?"** is a daily decision with no easy way to get quick feedback from friends
3. **Wardrobe gaps are invisible** — people buy duplicates or miss complementary pieces because they can't see their full wardrobe at a glance
4. **Fashion inspiration is passive** — apps like Instagram/TikTok show outfits, but there's no way to act on them (save, shop, recreate)
5. **Shopping links get lost** — you see something you like, but the link to buy it disappears in your browser history

---

## The Solution

Closet Memories solves this by combining five pillars:

### 1. Digital Closet (Organize)
Upload photos or record videos of your outfits. Each item gets automatically categorized by AI into TOPS, BOTTOMS, DRESSES, SHOES, or ACCESSORIES. Add memory notes ("Wore this to prom"), tags (casual, dressy, party), and keep everything searchable and filterable.

### 2. AI Stylist (Suggest)
The app analyzes your entire wardrobe and generates personalized outfit combinations. It considers which categories you have, what styles match, and even tells you what's missing ("Add some shoes to complete your looks!"). Powered by OpenAI GPT-4 Vision.

### 3. Outfit Polls (Decide)
Can't decide what to wear? Select 2-3 outfits from your closet, create a poll, and share a link with friends. They vote anonymously (no account required), and you see results in real time. Perfect for "date night outfit?" or "which one for the interview?"

### 4. Public Feed (Discover)
A TikTok-style vertical feed where users can post their outfits publicly. Scroll through full-screen outfit cards, like favorites, save looks, and get inspired. Trial users can browse the feed without signing up.

### 5. Shoppable Tags (Shop)
Tag individual clothing items in your photos with product links. If someone sees your outfit and loves the jacket, they can tap and go straight to the store. For videos, tags can be timestamped to specific moments.

---

## Features (Detailed)

### Upload & Capture
- **Photo upload** from device (drag-and-drop supported)
- **Webcam capture** directly in the app
- **Video recording** with in-app recorder
- Files stored on Google Cloud Storage via presigned URLs
- 10MB file size limit per upload

### Closet Organization
- **Category filtering**: ALL, TOPS, BOTTOMS, DRESSES, SHOES, ACCESSORIES
- **AI auto-classification**: When you upload a photo, GPT-4 Vision analyzes it and assigns a category + sub-category (e.g., TOPS > hoodie) with a confidence score (0-100)
- **Manual override**: Users can change the AI-assigned category
- **Bulk operations**: Select multiple items and move them to a different category
- **Memory notes**: Free-text field to attach context ("Birthday dinner 2024", "Found at the thrift store")
- **Tags**: Pre-defined (casual, dressy, party, work, date night, sporty, vintage, boho, streetwear, preppy, minimalist, grunge) plus custom tags
- **Sorting**: By date added (newest/oldest)

### AI Outfit Suggestions
- Analyzes the user's full wardrobe grouped by category
- Generates 1-2 outfit combinations with reasoning
- Rules-based: each outfit must have (1 TOP + 1 BOTTOM) or (1 DRESS), optionally with SHOES and ACCESSORIES
- Returns "nudges" when the wardrobe is incomplete (e.g., "Add some bottoms to mix and match!")
- Falls back to a deterministic algorithm if the AI call fails
- Handles edge cases: empty closet, insufficient items, no matching pieces

### Outfit Polls
- Select 2-3 items from your closet
- Give the poll a title ("Friday night vibes?")
- System generates a unique share link (UUID-based)
- Anyone with the link can vote — no account required
- One vote per person (tracked by IP address)
- Creator sees vote counts and percentages
- Polls are permanent and always accessible via their link

### Public Feed
- **Full-screen vertical scroll** (TikTok-style UX)
- Cursor-based pagination (10 items per page, infinite scroll)
- Interaction buttons: Like, Save, Share, Comment
- Sound effects on like/unlike
- **Trial mode**: Unauthenticated users can browse the feed; after viewing 6 items, a signup prompt appears
- Falls back to demo content if no public items exist yet

### Visibility & Sharing
Three visibility levels for items:
- **Private**: Only you can see it (default)
- **Friends**: Visible to your accepted friends in their feed
- **Public**: Visible to everyone in the public feed

Items must be explicitly "posted" to appear in feeds (setting visibility alone isn't enough — the user clicks a "Post" action which sets the `postedAt` timestamp).

### Friend System
- **Search**: Find users by name or email (minimum 2 characters)
- **Friend requests**: Send, accept, or decline
- **Friends feed**: See friends' posted items (friends + public visibility)
- **Remove friends**: Unfriend at any time (bidirectional removal)

### Wishlist
- Save items from any brand or store
- Fields: name, brand, store, price, image URL, product URL, notes
- Grid view of saved items
- Click through to product URLs
- Completely separate from the closet — this is for items you want to buy, not items you own

### Shoppable Clothing Links
- Attach product links to any outfit photo
- Each link has: item name + store URL
- For videos: links can include a timestamp (seconds) indicating when the item appears
- Viewers can tap links to shop directly

---

## User Flows

### New User Journey
1. Lands on the marketing page — sees hero section, feature highlights, and demo video
2. Clicks "Explore Demo" to try the app without signing up
3. Browses 15 pre-loaded demo outfits and 3 demo polls
4. Scrolls the public feed (TikTok-style)
5. After interacting with 6 items, sees a signup prompt
6. Signs up via OIDC provider
7. Redirected to empty closet — prompted to upload first outfit

### Daily Use Flow
1. Open app → see closet with all items
2. Upload new outfit photo → AI auto-categorizes it
3. Add memory note and tags
4. Optionally post to feed (public or friends-only)
5. Check AI suggestions for today's outfit
6. Browse friends' feed for inspiration
7. Create a poll if deciding between outfits

### Social Flow
1. Search for a friend by name → send friend request
2. Friend accepts → mutual friendship created
3. Post an outfit with "friends" visibility
4. Friend sees it in their feed
5. Create a poll → share link via text/social media
6. Friends vote → check results

---

## Data Model

### Core Entities

**User**
- ID, email, first name, last name, profile image
- Created via OIDC authentication

**Item** (Closet Entry)
- Photo/video URL, media type
- Title, memory note
- Tags (array of strings)
- Clothing links (array of {name, url, timestamp?})
- Visibility (private / friends / public)
- Category (TOPS / BOTTOMS / DRESSES / SHOES / ACCESSORIES)
- Sub-category (free text, e.g., "hoodie", "sneakers")
- AI classification confidence (0-100)
- Classification source (AI or USER)
- Posted-at timestamp (null until posted to feed)

**Poll**
- Title, item IDs (2-3 references), share link (UUID)
- Votes tracked in separate table (voter IP + selected item)

**Friend Request**
- From user, to user, status (pending / accepted / declined)

**Friendship**
- Bidirectional (two rows: A→B and B→A)

**Wishlist Item**
- Name, brand, store, price, image URL, product URL, notes

---

## Architecture Overview

```
Client (React + Vite)
  |
  |-- Pages: Landing, Home, Media, Friends, Wishlist, Poll, Category, Signin
  |-- State: TanStack React Query (server state), React Context (trial mode)
  |-- Routing: Wouter (lightweight client-side router)
  |-- Uploads: Uppy (S3 presigned URL uploads)
  |
  v
Server (Express.js + TypeScript)
  |
  |-- Auth: Passport.js + OpenID Connect (OIDC)
  |-- Sessions: PostgreSQL-backed (connect-pg-simple)
  |-- API: RESTful endpoints for items, polls, friends, wishlist, feed
  |-- AI: OpenAI GPT-4 Vision (classification + suggestions)
  |-- Storage: Google Cloud Storage (media files)
  |
  v
Database (PostgreSQL via Drizzle ORM)
  |
  |-- Tables: users, items, polls, poll_votes, friend_requests, friends, wishlist_items, sessions
  |-- Migrations managed by Drizzle Kit
```

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Session encryption key |
| `AUTH_DOMAINS` | Yes | Comma-separated domains for OIDC callbacks |
| `OIDC_CLIENT_ID` | Yes | OIDC client identifier |
| `OIDC_ISSUER_URL` | Yes | OIDC provider discovery URL |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI features |
| `OPENAI_BASE_URL` | No | Custom OpenAI endpoint (if using proxy) |
| `GCS_PROJECT_ID` | No | Google Cloud project ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes* | Path to GCS service account key (*required for file uploads) |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Yes* | Comma-separated GCS paths for public objects (*required for serving media) |
| `PRIVATE_OBJECT_DIR` | Yes* | GCS path for private uploads (*required for file uploads) |
| `PORT` | No | Server port (default: 5000) |

---

## Demo / Trial Mode

Unauthenticated users get a "trial" experience:
- **15 demo outfits** spanning multiple styles (casual, dressy, business, sporty, vintage, boho, streetwear, etc.) with realistic photos, memory notes, and tags
- **3 demo polls** with sample votes
- **Full feed access** with signup prompts after 6 interactions
- **Cannot**: upload items, create polls, use AI suggestions, manage friends, or save to wishlist

This lets potential users experience the core value before committing to an account.

---

## Key Product Decisions

1. **Anonymous poll voting** — Polls use IP-based tracking instead of requiring accounts, maximizing participation. The tradeoff is that determined users could vote multiple times via VPN.

2. **AI classification on upload** — Every photo is auto-classified at upload time rather than on-demand. This ensures the closet is always organized without user effort.

3. **Three-tier visibility** — Private/Friends/Public gives users fine-grained control. The explicit "Post" action (separate from visibility setting) prevents accidental public sharing.

4. **TikTok-style feed** — Full-screen vertical scroll matches the content type (outfit photos are naturally vertical/portrait) and matches the target audience's UX expectations.

5. **Wishlist as separate entity** — The wishlist is intentionally separate from the closet. Closet = things you own. Wishlist = things you want. This prevents confusion and keeps the closet accurate.

6. **Video support with timestamped links** — Videos show outfits in motion, and timestamped shoppable links let viewers jump to the exact moment an item appears.

7. **Nudge system** — Instead of just suggesting outfits, the AI tells users what's missing from their wardrobe. This drives engagement ("upload more items to get better suggestions") and could drive shopping behavior.
