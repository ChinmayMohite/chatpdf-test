import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { chats } from "@/lib/db/schema";
import ChatSideBar from "@/components/ChatSideBar";
import PDFViewer from "@/components/PDFViewer";
import ChatComponent from "@/components/ChatComponent";

type Props = {
  params: {
    chatId: string;
  };
};

const ChatPage = async ({ params: { chatId } }: Props) => { 
  const {userId} = await auth();
  if (!userId) {
    return redirect("/sign-in");
  }
  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));
  if(!_chats){
    return redirect("/");
  }
  if(!_chats.find(chat => chat.id === parseInt(chatId))){
    return redirect("/");
  }
  const currentChat  = _chats.find(chat => chat.id === parseInt(chatId));
  return <div className="flex max-h-screen overflow-scroll no-scrollbar scrollbar-hide">
    <div className="flex w-full max-h-screen overflow-scroll no-scrollbar">
      {/* Render chat Sidebar */}
      <div className="flex-[1] max-w-xs">
        {/* Render Sidebar */}
        <ChatSideBar chats={_chats} chatId={parseInt(chatId)}></ChatSideBar>
      </div>
      {/* Render Pdf Viewer */}
      <div className="flex-[5] max-h-screen p-4 overflow-scroll no-scrollbar">
        {/* Render Pdf */}
        <PDFViewer pdf_url={currentChat?.pdfUrl || ''}></PDFViewer>
      </div>
      {/* Render Chats */}
      <div className="flex-[3] border-l-4 border-1-slate-200 no-scrollbar">
        {/* Render Chats Component */}
        <ChatComponent chatId={parseInt(chatId)}></ChatComponent>
      </div>

    </div>
  </div>;
};

export default ChatPage;
