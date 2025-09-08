import { pgTable, serial, varchar, text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const judges = pgTable('judges', {
  id: serial('id').primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  members: jsonb('members').$type<TeamMember[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  judgeId: integer('judge_id').references(() => judges.id),
});

export const scores = pgTable('scores', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id).notNull(),
  judgeId: integer('judge_id').references(() => judges.id).notNull(),
  innovation: integer('innovation').notNull(), // 1-10
  technical: integer('technical').notNull(), // 1-10
  presentation: integer('presentation').notNull(), // 1-10
  impact: integer('impact').notNull(), // 1-10
  overall: integer('overall').notNull(), // 1-10
  feedback: text('feedback'),
  isFinalized: boolean('is_finalized').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type TeamMember = {
  name: string;
  role?: string;
};

export type Judge = typeof judges.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Score = typeof scores.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type NewScore = typeof scores.$inferInsert;