import { pgTable, text, timestamp, uuid,integer,varchar, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  password: text("password").notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  phone: varchar("phone", { length: 25 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const passwordResets = pgTable("password_resets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  code : varchar("code", { length: 100 }).notNull().unique(),
  price: integer("price").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const igrejas = pgTable("igrejas", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }).notNull().unique(),
    number: integer("number").notNull(),
    street: varchar("street", { length: 256 }).notNull(),
    city: varchar("city", { length: 256 }).notNull(),
    state: varchar("state", { length: 256 }).notNull(),
    zipCode: varchar("zip_code", { length: 20 }).notNull(),
    neighborhood: varchar("neighborhood", { length: 256 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stock = pgTable("stock", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId : uuid("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId : uuid("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  igrejaId : uuid("igreja_id").notNull().references(() => igrejas.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, LOGIN, etc
  entityType: varchar("entity_type", { length: 100 }).notNull(), // users, products, orders, etc
  entityId: uuid("entity_id"), // ID do registro afetado (pode ser null para ações gerais)
  oldData: text("old_data"), // JSON com dados anteriores (para UPDATE/DELETE)
  newData: text("new_data"), // JSON com dados novos (para CREATE/UPDATE)
  ipAddress: varchar("ip_address", { length: 45 }), // Endereço IP do usuário
  userAgent: text("user_agent"), // User agent do navegador
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

