// src/routes/api/tickets/+server.ts
import { db } from '../../../lib/server/db/client';
import { tickets } from '../../../lib/server/db/schema';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
  try {
    const data = await db.select().from(tickets);
    return json(data);
  } catch (err) {
    console.error('Failed to fetch tickets:', err);
    throw error(500, 'Unable to fetch tickets');
  }
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  const {
    licensePlate,
    driverName,
    violationType,
    fineAmount,
    dateIssued,
    isPaid
  } = body;

  try {
    const [created] = await db
      .insert(tickets)
      .values({
        licensePlate,
        driverName,
        violationType,
        fineAmount,
        dateIssued: new Date(dateIssued),
        isPaid
      })
      .returning();

    return json(created, { status: 201 });
  } catch (err) {
    console.error(err);
    throw error(500, 'Failed to create ticket');
  }
};
