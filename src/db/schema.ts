import { pgTable, text, timestamp, uuid, integer, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. TABELA DE IGREJAS
export const igrejas = pgTable("igrejas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  cnpj: varchar("cnpj", { length: 20 }),
  street: text("street"),
  number: varchar("number", { length: 20 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 2. TABELA DE USUÁRIOS (Vinculados a uma igreja)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  igrejaId: uuid("igreja_id").references(() => igrejas.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 3. TABELA DE PRODUTOS (Vinculados a uma igreja)
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  igrejaId: uuid("igreja_id").references(() => igrejas.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// RELAÇÕES (Essencial para o Drizzle)
export const igrejaRelations = relations(igrejas, ({ many }) => ({
  users: many(users),
  products: many(products),
}));

export const userRelations = relations(users, ({ one }) => ({
  igreja: one(igrejas, { fields: [users.igrejaId], references: [igrejas.id] }),
}));