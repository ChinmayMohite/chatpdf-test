//db schema
//anything in SQL DB is a pg table
import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

//enum for role, messages send by who, user for users, system for chatbot reply
export const userSystemEnum = pgEnum('role', ['user', 'system']);

//define the chat schema (one single chat based on one document)
export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  pdfName: text('pdfName').notNull(),
  pdfUrl: text('pdfUrl').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  userId: varchar('userId', { length: 256 }).notNull(),
  //refer to user which belongs to.
  // varchar requires a length, comparing with text, it is more efficient and better for storing short strings
  fileKey: text('fileKey').notNull(),
  //refer to AWS S3 bucket
});

//export the type of chats(as a new costom variable include the info in schema)
export type DrizzleChat = typeof chats.$inferSelect;

//schema for each message
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  chatId: integer('chatId')
    .references(() => chats.id)
    .notNull(),
  //refer to chats table and the id it belongs to
  content: text('content').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  //who send the message? user or chatbot, in a role enum
  role: userSystemEnum('role').notNull().default('system'),
});

export const userSubscriptions = pgTable('user_subscriptions', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull().unique(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 256 })
    .notNull()
    .unique(),
  stripeSubscriptionId: varchar('stripe_subscription_id', {
    length: 256,
  }).unique(),
  stripePriceId: varchar('stripe_price_id', { length: 256 }),
  stripeCurrentPeriodEnd: timestamp('stripe_current_period_ended_at'),
});

export const tokenRecords = pgTable('token_records', {
  id: serial('id').primaryKey(),
  userId: varchar('userId', { length: 256 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});