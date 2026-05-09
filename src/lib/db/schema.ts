import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core"

// ─── User ────────────────────────────────────────────────────────────
export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 100 }),
  bio: varchar("bio", { length: 500 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── Portfolio ───────────────────────────────────────────────────────
export const portfolio = pgTable("portfolio", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),
  slug: varchar("slug", { length: 32 }).notNull().unique(),
  theme: varchar("theme", { length: 50 }).default("minimal-light").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── Project ─────────────────────────────────────────────────────────
export const project = pgTable("project", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolio.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }).notNull(),
  description: varchar("description", { length: 1000 }),
  imageUrl: text("image_url"),
  demoUrl: text("demo_url"),
  githubUrl: text("github_url"),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── Link ────────────────────────────────────────────────────────────
export const link = pgTable("link", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolio.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 50 }).notNull(),
  url: text("url").notNull(),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── Password Reset Token (Plan 1.2.1) ───────────────────────────────
export const passwordResetToken = pgTable("password_reset_token", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
