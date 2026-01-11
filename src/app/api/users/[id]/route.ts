import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Atualizar usuário
 *     description: Atualiza dados de um usuário existente (requer autenticação)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               cpf:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);

    if (!auth.success) {
      return NextResponse.json(
        { error: "Não autorizado. Token JWT necessário." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, password, cpf, phone } = body;

    // Buscar usuário existente
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Email inválido" },
          { status: 400 }
        );
      }
      
      // Verificar se email já existe em outro usuário
      const [emailExists] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (emailExists && emailExists.id !== id) {
        return NextResponse.json(
          { error: "Email já cadastrado" },
          { status: 409 }
        );
      }
      
      updateData.email = email;
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "A senha deve ter no mínimo 6 caracteres" },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (cpf) {
      const cpfDigits = cpf.replace(/\D/g, "");
      if (cpfDigits.length !== 11) {
        return NextResponse.json(
          { error: "CPF deve conter 11 dígitos" },
          { status: 400 }
        );
      }
      const formattedCpf = `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9, 11)}`;
      
      // Verificar se CPF já existe em outro usuário
      const [cpfExists] = await db
        .select()
        .from(users)
        .where(eq(users.cpf, formattedCpf))
        .limit(1);
      
      if (cpfExists && cpfExists.id !== id) {
        return NextResponse.json(
          { error: "CPF já cadastrado" },
          { status: 409 }
        );
      }
      
      updateData.cpf = formattedCpf;
    }

    if (phone) {
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        return NextResponse.json(
          { error: "Telefone deve conter pelo menos 10 dígitos" },
          { status: 400 }
        );
      }
      updateData.phone = phoneDigits;
    }

    updateData.updatedAt = new Date();

    // Atualizar usuário
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        cpf: users.cpf,
        phone: users.phone,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    // Registrar no audit log
    await createAuditLog({
      userId: auth.user!.userId,
      action: "UPDATE",
      entityType: "users",
      entityId: id,
      oldData: existingUser,
      newData: updatedUser,
      request,
    });

    return NextResponse.json(
      {
        message: "Usuário atualizado com sucesso",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Deletar usuário
 *     description: Remove um usuário do sistema (requer autenticação)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuário deletado com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);

    if (!auth.success) {
      return NextResponse.json(
        { error: "Não autorizado. Token JWT necessário." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Buscar usuário existente
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Não permitir deletar o próprio usuário
    if (id === auth.user!.userId) {
      return NextResponse.json(
        { error: "Você não pode deletar seu próprio usuário" },
        { status: 400 }
      );
    }

    // Deletar usuário
    await db.delete(users).where(eq(users.id, id));

    // Registrar no audit log
    await createAuditLog({
      userId: auth.user!.userId,
      action: "DELETE",
      entityType: "users",
      entityId: id,
      oldData: existingUser,
      newData: undefined,
      request,
    });

    return NextResponse.json(
      {
        message: "Usuário deletado com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
