//   /api/create-chat
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3intoPinecone } from "@/lib/pinecone";
import { auth } from "@clerk/nextjs/server";
import { getS3Url } from "@/lib/s3";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  try {
    const body = await req.json();
    // Process the uploaded file here
    const { file_key, file_name } = body;
    await loadS3intoPinecone(file_key);
    // return NextResponse.json({ pages: pages });
    const chats_id = await db
      .insert(chats)
      .values({
        fileKey: file_key,
        pdfName: file_name,
        pdfUrl: getS3Url(file_key),
        userId,
      })
      .returning({
        insertedId: chats.id,
      });
    return NextResponse.json(
      {
        chats_id: chats_id[0].insertedId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      message: "An error occurred while processing your request",
      error,
    });
  }
}
 