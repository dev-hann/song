export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  registeredAt: string;
  lastLogin: string;
  isActive: boolean;
}

export interface AuthResponse {
  registered: boolean;
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}
