CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"old_data" jsonb,
	"new_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "igrejas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(256) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"cnpj" varchar(20),
	"street" text,
	"number" varchar(20),
	"city" varchar(100),
	"state" varchar(50),
	"zip_code" varchar(20),
	"neighborhood" varchar(100),
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "igrejas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "churches" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "churches" CASCADE;--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_church_id_churches_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_church_id_churches_id_fk";
--> statement-breakpoint
ALTER TABLE "stock" DROP CONSTRAINT "stock_church_id_churches_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_church_id_churches_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "customer_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "igreja_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "items" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "igreja_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "stock" ADD COLUMN "igreja_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "igreja_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_igreja_id_igrejas_id_fk" FOREIGN KEY ("igreja_id") REFERENCES "public"."igrejas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_igreja_id_igrejas_id_fk" FOREIGN KEY ("igreja_id") REFERENCES "public"."igrejas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_igreja_id_igrejas_id_fk" FOREIGN KEY ("igreja_id") REFERENCES "public"."igrejas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_igreja_id_igrejas_id_fk" FOREIGN KEY ("igreja_id") REFERENCES "public"."igrejas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "church_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "church_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "stock" DROP COLUMN "church_id";--> statement-breakpoint
ALTER TABLE "stock" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "church_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "updated_at";