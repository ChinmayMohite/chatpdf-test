import { db } from '@/lib/db';
import { tokenRecords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const tokenVerify = async (userId: string) => {
  let count = 0;
  const expired: number[] = [];
  try {
    const records = await db
      .select()
      .from(tokenRecords)
      .where(eq(tokenRecords.userId, userId));
    if (!Array.isArray(records)) {
      return { permission: false, expiredToken: [] };
    }

    records.forEach((record) => {
      if (
        new Date(record.createdAt) >
        new Date(
          Date.now() - parseInt(process.env.TOKEN_CYCLE!) * 60 * 60 * 1000
        )
      ) {
        count += 1;
      } else {
        expired.push(record.id);
      }
    });
    if (count < parseInt(process.env.MAX_TOKENS!)) {
      return { permission: true, expiredToken: expired };
    } else {
      return { permission: false, expiredToken: expired };
    }
  } catch (error) {
    console.error('Token verify error: ', error);
    return { permission: false, expiredToken: [] };
  }
};