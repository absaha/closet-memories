# Closet Memories

## Overview

Closet Memories is a teen-friendly closet management and outfit coordination application. The app allows users to upload photos and videos of their outfits, organize them with tags and memory notes, tag clothing items with shoppable links, create polls to get feedback on outfit choices, and receive AI-powered outfit suggestions. Built as a full-stack web application with a React frontend and Express backend, it features video recording, real-time polling, file upload capabilities, and OpenAI integration for personalized fashion recommendations.

## User Journey

### First-Time Visitors (Landing Page)
When users first visit the app, they see a beautiful landing page with two options:
- **View Demo** (highlighted): Shows a fully populated demo closet with 15+ outfits to explore the app's features
- **Sign In**: Redirects to authentication for existing users or signup

### Demo Mode
Clicking "View Demo" takes users to a fully functional demo closet showing:
- Grid layout of 15 diverse outfit cards (winter wear, summer dresses, business casual, etc.)
- Each outfit includes: image, title, memory note with emojis, and style tags
- Some outfits feature shoppable clothing links
- Full closet management interface without requiring signup
- Users can explore all features before creating an account

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **File Uploads**: Uppy for file upload management with dashboard modal interface

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **File Processing**: Custom object storage service with Google Cloud Storage integration
- **AI Integration**: OpenAI API for generating outfit suggestions
- **Development**: Hot module replacement with Vite integration in development mode

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **File Storage**: Google Cloud Storage for user-uploaded outfit photos
- **Session Storage**: In-memory storage for development (extensible to persistent storage)

### Authentication and Authorization
- **Current Implementation**: Mock user system for development
- **File Access**: Custom ACL (Access Control List) system for object storage
- **Anonymous Voting**: Session-based anonymous voting for polls using voter identifiers

### Core Features
- **Item Management**: CRUD operations for clothing items with photo uploads, tags, and memory notes
- **Polling System**: Create shareable polls for outfit feedback with real-time vote counting
- **AI Suggestions**: OpenAI-powered outfit recommendations based on user's wardrobe and current date
- **File Upload**: Direct-to-cloud upload with presigned URLs for security and performance
- **Wishlist**: Save desired fashion items from various brands and stores with name, brand, store, price, image, and product links

## External Dependencies

### Cloud Services
- **Neon Database**: PostgreSQL hosting for production database
- **Google Cloud Storage**: Object storage for user-uploaded photos with custom ACL policies
- **OpenAI API**: GPT model integration for generating fashion advice and outfit suggestions

### Third-Party Libraries
- **UI Components**: Radix UI for accessible component primitives
- **Styling**: Tailwind CSS for utility-first styling approach
- **File Uploads**: Uppy for robust file upload handling with AWS S3 compatibility
- **Date Handling**: date-fns for date manipulation and formatting
- **Validation**: Zod for runtime type validation and schema definitions

### Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Type Safety**: TypeScript with strict configuration across frontend and backend
- **Database Tooling**: Drizzle Kit for schema management and migrations
- **Runtime Error Handling**: Replit-specific error overlay for development debugging

### API Integrations
- **OpenAI GPT**: For generating personalized outfit suggestions with teen-friendly language
- **Google Cloud**: Authentication via service account for cloud storage operations
- **Replit Services**: Integration with Replit's sidecar services for cloud resource management