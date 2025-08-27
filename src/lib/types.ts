
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
}

export type RuleContentBlock = {
  id: string;
  type: 'heading' | 'subheading' | 'paragraph' | 'image';
  content: string; // For heading/paragraph text or image URL
};

export interface RuleCategory {
  id: string; // Firestore document ID
  title: string;
  image: string;
  description: string;
  content: RuleContentBlock[];
}

export interface StoreItem {
  id: string;
  name: string;
  price: number;
  currency: 'USD' | 'EUR' | 'MXN';
  description: string;
  terms: string;
  image: string;
  type: string;
  onSale?: boolean;
  salePrice?: number;
  featured?: boolean;
}

export interface User {
  id: string; // Firestore document ID
  uid: string; // Firebase Auth User ID
  username: string;
  email: string;
  avatar: string;
  role: 'owner' | 'admin' | 'user';
  packages?: StoreItem[]; // This will be populated from a subcollection
  discordUsername?: string;
  discordId?: string;
  minecraftUsername?: string;
}

export interface TermsOfUse {
    id: string;
    content: string;
}

export interface Appeal {
    id:string; // Firestore document ID
    userId: string;
    username: string;
    userEmail: string;
    sanctionType: 'ban' | 'warn' | 'mute' | 'permaban' | 'otro';
    reason: string;
    appealText: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: any; // Firestore Timestamp
}

    
