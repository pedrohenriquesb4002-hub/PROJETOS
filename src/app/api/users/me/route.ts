import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// GET /api/users/me - Obter dados do usuário autenticado
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const auth = requireAuth(request);

    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    // O token é válido, retornar dados do usuário
    return NextResponse.json(
      {
        message: "Usuário autenticado",
        user: auth.user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao obter dados do usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
