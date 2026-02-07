import { pgTable, text, timestamp, uuid, integer, varchar, jsonb } from "drizzle-orm/pg-core";

export const igrejas = pgTable("igrejas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  igrejaId: uuid("igreja_id").references(() => igrejas.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).default("admin"),
  // CAMPOS ADICIONADOS PARA CORRIGIR OS ERROS
  cpf: varchar("cpf", { length: 14 }).unique().notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ... (mantenha o restante das tabelas products, stock, orders e audit_log como estão)