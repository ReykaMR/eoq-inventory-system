import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: string;
    username: string;
    isActive: boolean;
    lastLogin: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role: string;
      username: string;
      isActive: boolean;
      lastLogin: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    username: string;
    isActive: boolean;
    lastLogin: string | null;
  }
}
