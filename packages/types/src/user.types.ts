export interface AppUser {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  createdAt: string;
  isActive: boolean;
  primaryRole: string | null;
}

export interface AppUserMe extends AppUser {
  permissions: string[];
}
