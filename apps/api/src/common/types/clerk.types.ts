export interface ClerkUser {
  sub: string;
  iss: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
}

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user: ClerkUser;
  resolvedPermissions?: string[];
}
