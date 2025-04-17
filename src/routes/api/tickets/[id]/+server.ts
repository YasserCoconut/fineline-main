import { db } from '$lib/server/db/client';
import { tickets } from '$lib/server/db/schema';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
  const id = Number(params.id);
  const result = await db.select().from(tickets).where(eq(tickets.id, id));
  if (!result.length) throw error(404, 'Ticket not found');
  return json(result[0]);
};

export const PUT: RequestHandler = async ({ request, params }) => {
  const id = Number(params.id);
  const body = await request.json();

  try {
    const [updated] = await db
      .update(tickets)
      .set({
        licensePlate: body.licensePlate,
        driverName: body.driverName,
        violationType: body.violationType,
        fineAmount: body.fineAmount,
        dateIssued: new Date(body.dateIssued),
        isPaid: body.isPaid
      })
      .where(eq(tickets.id, id))
      .returning();

    return json(updated);
  } catch (err) {
    console.error(err);
    throw error(500, 'Failed to update ticket');
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  const id = Number(params.id);

  try {
    await db.delete(tickets).where(eq(tickets.id, id));
    return json({ success: true });
  } catch (err) {
    console.error(err);
    throw error(500, 'Failed to delete ticket');
  }
};
