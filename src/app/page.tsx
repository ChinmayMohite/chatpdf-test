import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { LogIn } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import UserGuide from "@/components/UserGuide";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function Home() {
  const { userId } = auth();
  const user = await currentUser();
  const isAuth = !!userId;
  let latestDialog;

  if (userId) {
    const chatList = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId));
    if (chatList.length !== 0) {
      const id = chatList[chatList.length - 1].id;
      latestDialog = id;
    }
  }
  return (
    <div className="flex flex-col w-screen h-full min-h-screen bg-gradient-to-r from-yellow-200 via-green-200 to-green-300">
      <div className="relative">
        {" "}
        {/* Make the parent a relative container */}
        <div className="absolute top-4 right-4">
          {" "}
          {/* Position the button container */}
          <UserButton />
        </div>
        {/* Other content here */}
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/5">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl font-semibold">Chat with any PDF</h1>
          </div>
          <div className="mt-2 flex">
            {isAuth &&
              (latestDialog ? (
                <Link href={`/chat/${latestDialog}`}>
                  <Button>Go to Chats</Button>
                </Link>
              ) : (
                <p className="my-2">
                  You don&apos;t have any File yet, Start to Upload!
                </p>
              ))}
          </div>
          <p className="max-w-xl mt-2 text-lg text-slate-700">
            ChatPDF: Talk to Your Documents, Get Instant Answers !
          </p>
          <div className="w-full mt-4">
            {isAuth ? (
              <FileUpload></FileUpload>
            ) : (
              <Link href="/sign-in">
                <Button>
                  Login to get started !
                  <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
        <div className="flex px-2">
          <UserGuide />
        </div>
      </div>
    </div>
  );
}
