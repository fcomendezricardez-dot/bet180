import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    rol: "ADMIN" | "OPERADOR" | "GESTOR";
    letra: string | null;
  }

  interface Session {
    user: {
      id: string;
      rol: "ADMIN" | "OPERADOR" | "GESTOR";
      letra: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rol: "ADMIN" | "OPERADOR" | "GESTOR";
    letra: string | null;
  }
}
