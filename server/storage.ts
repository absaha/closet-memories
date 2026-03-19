import { type User, type InsertUser, type UpsertUser, type Item, type InsertItem, type Poll, type InsertPoll, type PollVote, type InsertPollVote, type FriendRequest, type InsertFriendRequest, type Friend, type InsertFriend, type WishlistItem, type InsertWishlistItem } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  searchUsers(query: string, excludeUserId?: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Item methods
  getItem(id: string): Promise<Item | undefined>;
  getItemsByUserId(userId: string): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, item: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<boolean>;

  // Poll methods
  getPoll(id: string): Promise<Poll | undefined>;
  getPollByShareLink(shareLink: string): Promise<Poll | undefined>;
  getPollsByUserId(userId: string): Promise<Poll[]>;
  createPoll(poll: InsertPoll): Promise<Poll>;
  updatePoll(id: string, poll: Partial<Poll>): Promise<Poll | undefined>;
  deletePoll(id: string): Promise<boolean>;

  // Poll vote methods
  getPollVotes(pollId: string): Promise<PollVote[]>;
  createPollVote(vote: InsertPollVote): Promise<PollVote>;
  getVoteByPollAndVoter(pollId: string, voterIdentifier: string): Promise<PollVote | undefined>;

  // Friend request methods
  createFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest | null>;
  getIncomingRequests(userId: string): Promise<FriendRequest[]>;
  getOutgoingRequests(userId: string): Promise<FriendRequest[]>;
  respondToFriendRequest(requestId: string, action: 'accept' | 'decline'): Promise<boolean>;

  // Friend methods
  listFriends(userId: string): Promise<Friend[]>;
  removeFriend(userId: string, friendId: string): Promise<boolean>;

  // Public feed methods
  listPublicItemsPaginated(limit: number, cursor?: string): Promise<{ items: Item[], nextCursor?: string }>;

  // Wishlist methods
  getWishlistItems(userId: string): Promise<WishlistItem[]>;
  createWishlistItem(item: InsertWishlistItem): Promise<WishlistItem>;
  deleteWishlistItem(id: string, userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private items: Map<string, Item>;
  private polls: Map<string, Poll>;
  private pollVotes: Map<string, PollVote>;
  private friendRequests: Map<string, FriendRequest>;
  private friends: Map<string, Friend>;
  private wishlistItems: Map<string, WishlistItem>;

  constructor() {
    this.users = new Map();
    this.items = new Map();
    this.polls = new Map();
    this.pollVotes = new Map();
    this.friendRequests = new Map();
    this.friends = new Map();
    this.wishlistItems = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }


  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    if (!query.trim()) {
      return [];
    }
    
    return Array.from(this.users.values())
      .filter(user => {
        if (excludeUserId && user.id === excludeUserId) {
          return false;
        }
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        const queryLower = query.toLowerCase();
        return fullName.includes(queryLower) || email.includes(queryLower);
      })
      .slice(0, 10); // Limit results
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      email: insertUser.email || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error('User ID is required for upsert operation');
    }
    
    const existingUser = this.users.get(userData.id);
    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        id: userData.id,
        email: userData.email || existingUser.email,
        firstName: userData.firstName || existingUser.firstName,
        lastName: userData.lastName || existingUser.lastName,
        profileImageUrl: userData.profileImageUrl || existingUser.profileImageUrl,
        updatedAt: new Date()
      };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      const newUser: User = {
        id: userData.id,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.users.set(userData.id, newUser);
      return newUser;
    }
  }

  // Item methods
  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async getItemsByUserId(userId: string): Promise<Item[]> {
    return Array.from(this.items.values()).filter(
      (item) => item.userId === userId
    ).sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = randomUUID();
    const item: Item = { 
      ...insertItem, 
      id, 
      dateAdded: new Date(),
      title: insertItem.title || null,
      memoryNote: insertItem.memoryNote || null,
      tags: insertItem.tags || null,
      visibility: insertItem.visibility || "private",
      postedAt: null,
      scheduledDay: null
    };
    this.items.set(id, item);
    return item;
  }

  async updateItem(id: string, itemUpdate: Partial<Item>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemUpdate };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItem(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  // Poll methods
  async getPoll(id: string): Promise<Poll | undefined> {
    return this.polls.get(id);
  }

  async getPollByShareLink(shareLink: string): Promise<Poll | undefined> {
    return Array.from(this.polls.values()).find(
      (poll) => poll.shareLink === shareLink
    );
  }

  async getPollsByUserId(userId: string): Promise<Poll[]> {
    return Array.from(this.polls.values()).filter(
      (poll) => poll.userId === userId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createPoll(insertPoll: InsertPoll): Promise<Poll> {
    const id = randomUUID();
    const shareLink = randomUUID();
    const poll: Poll = { 
      ...insertPoll, 
      id, 
      shareLink,
      votes: {},
      createdAt: new Date()
    };
    this.polls.set(id, poll);
    return poll;
  }

  async updatePoll(id: string, pollUpdate: Partial<Poll>): Promise<Poll | undefined> {
    const poll = this.polls.get(id);
    if (!poll) return undefined;
    
    const updatedPoll = { ...poll, ...pollUpdate };
    this.polls.set(id, updatedPoll);
    return updatedPoll;
  }

  async deletePoll(id: string): Promise<boolean> {
    return this.polls.delete(id);
  }

  // Poll vote methods
  async getPollVotes(pollId: string): Promise<PollVote[]> {
    return Array.from(this.pollVotes.values()).filter(
      (vote) => vote.pollId === pollId
    );
  }

  async createPollVote(insertVote: InsertPollVote): Promise<PollVote> {
    const id = randomUUID();
    const vote: PollVote = { 
      ...insertVote, 
      id, 
      createdAt: new Date()
    };
    this.pollVotes.set(id, vote);
    return vote;
  }

  async getVoteByPollAndVoter(pollId: string, voterIdentifier: string): Promise<PollVote | undefined> {
    return Array.from(this.pollVotes.values()).find(
      (vote) => vote.pollId === pollId && vote.voterIdentifier === voterIdentifier
    );
  }

  // Friend request methods
  async createFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest | null> {
    // Prevent self-requests
    if (fromUserId === toUserId) {
      return null;
    }

    // Check if request already exists
    const existingRequest = Array.from(this.friendRequests.values()).find(
      (request) => 
        (request.fromUserId === fromUserId && request.toUserId === toUserId) ||
        (request.fromUserId === toUserId && request.toUserId === fromUserId)
    );

    if (existingRequest) {
      return null; // Request already exists
    }

    // Check if they're already friends
    const existingFriendship = Array.from(this.friends.values()).find(
      (friend) => 
        (friend.userId === fromUserId && friend.friendId === toUserId) ||
        (friend.userId === toUserId && friend.friendId === fromUserId)
    );

    if (existingFriendship) {
      return null; // Already friends
    }

    const id = randomUUID();
    const friendRequest: FriendRequest = {
      id,
      fromUserId,
      toUserId,
      status: "pending",
      createdAt: new Date()
    };
    
    this.friendRequests.set(id, friendRequest);
    return friendRequest;
  }

  async getIncomingRequests(userId: string): Promise<FriendRequest[]> {
    return Array.from(this.friendRequests.values()).filter(
      (request) => request.toUserId === userId && request.status === "pending"
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getOutgoingRequests(userId: string): Promise<FriendRequest[]> {
    return Array.from(this.friendRequests.values()).filter(
      (request) => request.fromUserId === userId && request.status === "pending"
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async respondToFriendRequest(requestId: string, action: 'accept' | 'decline'): Promise<boolean> {
    const request = this.friendRequests.get(requestId);
    if (!request || request.status !== "pending") {
      return false;
    }

    // Update request status
    const updatedRequest = { ...request, status: action };
    this.friendRequests.set(requestId, updatedRequest);

    // If accepted, create friendship entries for both users
    if (action === 'accept') {
      const friendship1Id = randomUUID();
      const friendship2Id = randomUUID();
      
      const friendship1: Friend = {
        id: friendship1Id,
        userId: request.fromUserId,
        friendId: request.toUserId,
        createdAt: new Date()
      };
      
      const friendship2: Friend = {
        id: friendship2Id,
        userId: request.toUserId,
        friendId: request.fromUserId,
        createdAt: new Date()
      };

      this.friends.set(friendship1Id, friendship1);
      this.friends.set(friendship2Id, friendship2);
    }

    return true;
  }

  // Friend methods
  async listFriends(userId: string): Promise<Friend[]> {
    return Array.from(this.friends.values()).filter(
      (friend) => friend.userId === userId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async removeFriend(userId: string, friendId: string): Promise<boolean> {
    // Find and remove both friendship entries
    const friendships = Array.from(this.friends.entries()).filter(
      ([id, friend]) => 
        (friend.userId === userId && friend.friendId === friendId) ||
        (friend.userId === friendId && friend.friendId === userId)
    );

    let removed = false;
    for (const [id] of friendships) {
      this.friends.delete(id);
      removed = true;
    }

    return removed;
  }

  // Public feed methods
  async listPublicItemsPaginated(limit: number, cursor?: string): Promise<{ items: Item[], nextCursor?: string }> {
    // Get all public items that have been posted
    let publicItems = Array.from(this.items.values())
      .filter(item => item.visibility === "public" && item.postedAt !== null)
      .sort((a, b) => {
        // Sort by postedAt desc, then by id for stable ordering
        const timeCompare = new Date(b.postedAt!).getTime() - new Date(a.postedAt!).getTime();
        if (timeCompare !== 0) return timeCompare;
        return b.id.localeCompare(a.id);
      });

    // If cursor is provided, filter items after the cursor
    if (cursor) {
      try {
        const [cursorTime, cursorId] = cursor.split('|');
        const cursorTimestamp = new Date(cursorTime).getTime();
        
        publicItems = publicItems.filter(item => {
          const itemTime = new Date(item.postedAt!).getTime();
          // Include items that are older than cursor, or same time but lexicographically after cursor id
          return itemTime < cursorTimestamp || (itemTime === cursorTimestamp && item.id < cursorId);
        });
      } catch (e) {
        // Invalid cursor, ignore and return from start
      }
    }

    // Limit results
    const items = publicItems.slice(0, limit);
    
    // Generate next cursor if there are more items
    let nextCursor: string | undefined;
    if (items.length === limit && publicItems.length > limit) {
      const lastItem = items[items.length - 1];
      nextCursor = `${lastItem.postedAt!.toISOString()}|${lastItem.id}`;
    }

    return { items, nextCursor };
  }

  // Wishlist methods
  async getWishlistItems(userId: string): Promise<WishlistItem[]> {
    return Array.from(this.wishlistItems.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createWishlistItem(insertItem: InsertWishlistItem): Promise<WishlistItem> {
    const id = randomUUID();
    const item: WishlistItem = {
      id,
      userId: insertItem.userId,
      name: insertItem.name,
      brand: insertItem.brand || null,
      store: insertItem.store || null,
      price: insertItem.price || null,
      imageUrl: insertItem.imageUrl || null,
      productUrl: insertItem.productUrl || null,
      notes: insertItem.notes || null,
      createdAt: new Date()
    };
    this.wishlistItems.set(id, item);
    return item;
  }

  async deleteWishlistItem(id: string, userId: string): Promise<boolean> {
    const item = this.wishlistItems.get(id);
    if (!item || item.userId !== userId) return false;
    return this.wishlistItems.delete(id);
  }
}

export const storage = new MemStorage();
