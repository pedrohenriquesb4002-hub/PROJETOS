import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

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

    // Registrar criação no histórico
    await createAuditLog({
      userId: auth.user!.userId,
      action: "CREATE",
      entityType: "users",
      entityId: newUser.id,
      newData: newUser,
      request,
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

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar todos os usuários
 *     description: Retorna lista de todos os usuários (requer autenticação)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Não autorizado
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const auth = requireAuth(request);

    if (!auth.success) {
      return NextResponse.json(
        { error: "Não autorizado. Token JWT necessário." },
        { status: 401 }
      );
    }

    // Buscar todos os usuários (sem retornar a senha)
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        cpf: users.cpf,
        phone: users.phone,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);

    return NextResponse.json(
      {
        users: allUsers,
        count: allUsers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
