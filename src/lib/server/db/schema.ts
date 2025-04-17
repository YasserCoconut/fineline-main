// src/lib/db/schema.ts
import { pgTable, serial, varchar, numeric, timestamp, boolean } from 'drizzle-orm/pg-core';

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  licensePlate: varchar('license_plate', { length: 20 }).notNull(),
  driverName: varchar('driver_name', { length: 100 }).notNull(),
  violationType: varchar('violation_type', { length: 100 }).notNull(),
  fineAmount: numeric('fine_amount', { precision: 10, scale: 2 }).notNull(),
  dateIssued: timestamp('date_issued').defaultNow(),
  isPaid: boolean('is_paid').default(false).notNull(),
});
