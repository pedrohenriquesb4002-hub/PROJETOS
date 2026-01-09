import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { requireAuth } from "@/lib/auth";

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Criar novo usuário
 *     description: Cria um novo usuário no sistema (requer autenticação)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - cpf
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do usuário
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Senha do usuário (mínimo 6 caracteres)
 *               cpf:
 *                 type: string
 *                 description: CPF do usuário (11 dígitos)
 *               phone:
 *                 type: string
 *                 description: Telefone do usuário (mínimo 10 dígitos)
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       409:
 *         description: Email ou CPF já cadastrado
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const auth = requireAuth(request);

    if (!auth.success) {
      return NextResponse.json(
        { error: "Não autorizado. Token JWT necessário." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, password, cpf, phone } = body;

    // Validação básica
    if (!name || !email || !password || !cpf || !phone) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    // Sanitizar CPF e telefone: aceitar apenas dígitos
    const cpfDigits = (cpf || "").toString().replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      return NextResponse.json(
        { error: "CPF deve conter 11 dígitos" },
        { status: 400 }
      );
    }

    // Formatar CPF para 000.000.000-00 (armazenamento/uniqueness)
    const formattedCpf = `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9, 11)}`;

    const phoneDigits = (phone || "").toString().replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { error: "Telefone deve conter pelo menos 10 dígitos" },
        { status: 400 }
      );
    }

    // Validação de senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar se o email já existe
    const existingUserByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUserByEmail.length > 0) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 }
      );
    }

    // Verificar se o CPF já existe
    const existingUserByCpf = await db
      .select()
      .from(users)
      .where(eq(users.cpf, formattedCpf))
      .limit(1);

    if (existingUserByCpf.length > 0) {
      return NextResponse.json(
        { error: "CPF já cadastrado" },
        { status: 409 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        cpf: formattedCpf,
        phone: phoneDigits,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        cpf: users.cpf,
        phone: users.phone,
        createdAt: users.createdAt,
      });

    return NextResponse.json(
      {
        message: "Usuário criado com sucesso",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
