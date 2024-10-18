import { db } from '@/lib/db';
import { tokenRecords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const tokenCleanUp = async (expiredToken: number[]) => {
  expiredToken.forEach(async (id) => {
    try {
      await db.delete(tokenRecords).where(eq(tokenRecords.id, id));
    } catch (error) {
      console.error('Token clean up error: ', error);
    }
  });
};