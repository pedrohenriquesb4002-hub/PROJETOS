import { pgTable, text, timestamp, uuid, integer, varchar, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. IGREJAS
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

// 2. USUÁRIOS
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  igrejaId: uuid("igreja_id").references(() => igrejas.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 3. PRODUTOS
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  igrejaId: uuid("igreja_id").references(() => igrejas.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 4. ESTOQUE (Resolvendo o erro "Export stock doesn't exist")
export const stock = pgTable("stock", {
  id: uuid("id").primaryKey().defaultRandom(),
  igrejaId: uuid("igreja_id").references(() => igrejas.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 5. PEDIDOS (Resolvendo erros em api/orders)
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  igrejaId: uuid("igreja_id").references(() => igrejas.id, { onDelete: "cascade" }).notNull(),
  customerName: varchar("customer_name", { length: 256 }).notNull(),
  total: integer("total").notNull(),
  items: jsonb("items").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 6. LOGS DE AUDITORIA (Resolvendo erros em api/audit)
export const audit_log = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id"),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});