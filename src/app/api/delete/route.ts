import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { chats, messages } from '@/lib/db/schema';
import { convertToAscii } from '@/lib/utils';
import { deleteFromS3 } from '@/lib/s3Deletion';

export const DELETE = async (req: Request) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    //verify the chat owner
    const { chatId } = await req.json();
    try {
      const chat = await db.select().from(chats).where(eq(chats.id, chatId));
      if (!chat[0]) {
        return new NextResponse('Chat not found', { status: 404 });
      }
      if (chat[0].userId !== userId) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    } catch (error) {
      console.error('Fail to verify the chat owner', error);
      return new NextResponse('Fail to verify the chat owner', { status: 500 });
    }

    //delete the chat in NeonDB
    let file_key: string = '';
    try {
      await db.delete(messages).where(eq(messages.chatId, chatId));
      const rowReturned = await db
        .delete(chats)
        .where(eq(chats.id, chatId))
        .returning();
      if (rowReturned[0]) {
        file_key = rowReturned[0].fileKey;
      }
    } catch (error) {
      console.error('Fail to delete the chat in NeonDB', error);
      return new NextResponse(
        'Fail to delete the chat in NeonDB, please try again',
        { status: 500 }
      );
    }

    //delete the vector in pinecone
    const pineconeOptions = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Api-Key': `${process.env.PINECONE_API_KEY}`,
      },
      body: JSON.stringify({
        deleteAll: true,
        namespace: convertToAscii(file_key),
      }),
    };
    try {
      const res = await fetch(
        `${process.env.PINECONE_HOST}/vectors/delete`,
        pineconeOptions
      );
    } catch (error) {
      console.error('Fail to delete the vector in pinecone', error);
    }

    //waiting for implement delete in S3
    await deleteFromS3(file_key);
    return new NextResponse('OK Testing', { status: 200 });
  } catch (error) {
    console.error('Delete Chat Error', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};