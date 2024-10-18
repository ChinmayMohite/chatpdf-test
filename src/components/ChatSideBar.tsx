"use client";
import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { MessageCircle, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RotatingLines } from "react-loader-spinner";
import FileUpload from "./FileUpload";
import { toast } from "./ui/use-toast";
import axios from "axios";

type Props = {
  chats: DrizzleChat[];
  chatId: number;
};

const ChatSideBar = ({ chats, chatId }: Props) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const handleDeletion = async (chatId: number) => {
    try {
      setIsDeleting(true);
      const res = await axios.delete('/api/delete', { data: { chatId } });
      //this status handler actually is not working for axios
      if (res.status === 200) {
        router.push('/chat/new');
        toast({
          title: 'Deletion Success',
          description: 'There is nothing left there.',
        });
      } else if (res.status === 500) {
        toast({
          variant: 'destructive',
          title: 'Deletion Failed',
          description: 'Something went wrong, please try again.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Deletion Failed',
          description: "Can not find the chat, or you don't have permission.",
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: 'Something went wrong, please try again.',
      });
    } finally {
      setOpen(false);
      setIsDeleting(false);
    }
  };
  useEffect(() => {
    router.refresh();
  }, [chatId, router]);
  return (
    <div className="w-full h-screen p-4 text-gray-200 bg-gray-900 flex flex-col overflow-scroll">
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full border-dashed border-white border">
            <PlusCircle className="mr-2 w-4 h-4" />
            New Chat
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload a new File</DialogTitle>
          </DialogHeader>
          <div>
            <FileUpload />
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex pb-2 flex-col gap-2 my-4">
        {chats.map((chat) => (
          <Link key={chat.id} href={`/chat/${chat.id}`}>
            <div
              className={cn('rounded-lg p-3 text-slate-300 flex items-center', {
                'bg-blue-600 text-white': chat.id === chatId,
                'hover:text-white': chat.id !== chatId,
              })}
            >
              <MessageCircle className="mr-2" />
              <p className="w-full overflow-hidden text-sm truncate whitespace-nowrap text-ellipsis">
                {chat.pdfName}
              </p>

              {chat.id === chatId && (
                <AlertDialog open={open} onOpenChange={setOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="p-0 h-auto hover:bg-transparent"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Delete Your Chat</AlertDialogTitle>
                    {isDeleting ? (
                      <>
                        <AlertDialogHeader>
                          <div className="flex flex-col items-center">
                            <RotatingLines
                              strokeColor="grey"
                              strokeWidth="5"
                              animationDuration="0.75"
                              width="96"
                              visible={true}
                            />
                          </div>
                        </AlertDialogHeader>
                        <div className="flex flex-col items-center">
                          <AlertDialogFooter>
                            <p>Processing, Please wait.</p>
                          </AlertDialogFooter>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertDialogHeader>
                          <AlertDialogDescription>
                            By selecting Continue, you will delete any record,
                            file about this chat. Are you sure?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <Button onClick={() => handleDeletion(chat.id)}>
                            Continue
                          </Button>
                        </AlertDialogFooter>
                      </>
                    )}
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
export default ChatSideBar;
