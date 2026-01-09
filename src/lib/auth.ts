import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "seu-secret-super-seguro-aqui";

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Verifica e decodifica o token JWT do header Authorization
 * @param request - NextRequest object
 * @returns Payload do token ou null se inválido
 */
export function verifyToken(request: NextRequest): JWTPayload | null {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    return null;
  }
}

/**
 * Middleware helper para proteger rotas
 * @param request - NextRequest object
 * @returns Objeto com sucesso e dados do usuário ou erro
 */
export function requireAuth(request: NextRequest): {
  success: boolean;
  user?: JWTPayload;
  error?: string;
} {
  const user = verifyToken(request);

  if (!user) {
    return {
      success: false,
      error: "Token inválido ou ausente",
    };
  }

  return {
    success: true,
    user,
  };
}
