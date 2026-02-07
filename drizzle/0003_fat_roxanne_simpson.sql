CREATE TABLE "churches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "churches_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "audit_log" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "igrejas" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "password_resets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "audit_log" CASCADE;--> statement-breakpoint
DROP TABLE "igrejas" CASCADE;--> statement-breakpoint
DROP TABLE "password_resets" CASCADE;--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_code_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_cpf_unique";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_igreja_id_igrejas_id_fk";
--> statement-breakpoint
ALTER TABLE "stock" ALTER COLUMN "quantity" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "church_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_name" varchar(256);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "total" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "church_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "stock" ADD COLUMN "church_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "church_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(50) DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "quantity";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "igreja_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "cpf";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "phone";