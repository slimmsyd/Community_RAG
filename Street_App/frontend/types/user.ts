// Create a new file for user-related types
export interface Milestone {
  _id: string;
  date: string;
  title: string;
  description: string;
}

export interface UserDetails {
  exists: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    points?: number;
    profileImage?: string;
    profileImageId?: string;
    occupation?: string;
    phoneNumber?: string;
    birthDay?: string;
    maritalStatus?: string;
    location?: string;
    gender?: string;
    bio?: string;
    interests?: string[];
    milestones?: Milestone[];
    familyRole?: string;
    contributions?: string[];
  };
}

export interface DashboardSidebarProps {
  activePage?: string;
  onNavigate?: (page: string) => void;
  userName?: string;
  userAvatar?: string;
  rewardPoints?: number;
}

export interface RightDashboardProps {
  userName: string;
  userAvatar: string;
  userRole: string;
  familyMemberCount: number;
  onInvite: () => void;
  onSendMessage: () => void;
}

export interface FamilyTreeProps {
  currentPage: string;
  onNodeClick: (nodeId: string) => void;
  className?: string;
  userProfileImage?: string;
}

export interface WorkspaceMember {
  userId: string;
  name: string;
  email: string;
  profileImage?: string;
  role: string;
  joinedAt: string;
  familyConnections?: Array<{
    relatedUserId: string;
    relationship: string;
    confirmed: boolean;
  }>;
}