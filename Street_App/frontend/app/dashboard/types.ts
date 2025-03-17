export interface UserDetails {
  exists: boolean;
  user: {
    id: string;
    email: string;
    name?: string;
    plan?: string;
    subscriptionStatus?: string;
    subscriptionEndDate?: string;
    stripeKey?: string;
    invoicesSent?: number;
  };
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category?: string;
  tags?: string[];
  dateAdded: string;
  link: string;
  submitted_by: {
    user_id: string;
    username: string;
  };
  timestamp: Date;
  upvotes: number;
  _id: string;  
  auto_tagged: boolean;
}

export type ResourceCategory = string;

export interface ResourceSection {
  category: ResourceCategory;
  resources: Resource[];
  isOpen: boolean;
} 