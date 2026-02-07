import { pgTable, text, timestamp, uuid, integer, varchar, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. TABELA DE IGREJAS (Os Inquilinos/Tenants)
export const churches = pgTable("churches", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 2. USUÁRIOS
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  churchId: uuid("church_id").references(() => churches.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).default("admin"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 3. PRODUTOS
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  churchId: uuid("church_id").references(() => churches.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  price: integer("price").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 4. ESTOQUE
export const stock = pgTable("stock", {
  id: uuid("id").primaryKey().defaultRandom(),
  churchId: uuid("church_id").references(() => churches.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 5. PEDIDOS
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  churchId: uuid("church_id").references(() => churches.id, { onDelete: "cascade" }).notNull(),
  customerName: varchar("customer_name", { length: 256 }),
  total: integer("total").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// RELAÇÕES
export const churchRelations = relations(churches, ({ many }) => ({
  users: many(users),
  products: many(products),
}));

export const productRelations = relations(products, ({ one }) => ({
  church: one(churches, { fields: [products.churchId], references: [churches.id] }),
}));