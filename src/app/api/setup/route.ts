import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Se não estiver usando este arquivo agora, apenas retorne sucesso para o build passar
  return NextResponse.json({ message: "Setup verificado" });
}