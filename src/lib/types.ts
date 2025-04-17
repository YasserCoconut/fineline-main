// src/lib/types.ts
import type { InferSelectModel } from 'drizzle-orm';
import { tickets } from './server/db/schema';

export type Ticket = InferSelectModel<typeof tickets>;
