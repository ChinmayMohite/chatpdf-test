"use client";
import { uploadToS3 } from "@/lib/s3";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Inbox, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

type Props = {};

const FileUpload = (props: Props) => {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  // Create Mutation for react queries
  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      file_key,
      file_name,
    }: {
      file_key: string;
      file_name: string;
    }) => {
      const response = await axios.post("/api/create-chat", {
        file_key,
        file_name,
      });
      return response.data;
    },
  });

  // TODO: Implement file upload functionality
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      console.log("File uploading: ", acceptedFiles[0]);
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        // toast.error("File size exceeds 10MB");
        toast.error("File size exceeds 10MB");
        return;
      }
      // TODO: Upload file to S3 and handle response
      try {
        setUploading(true);
        const data = await uploadToS3(file);
        if (!data?.file_key || !data.file_name) {
          toast.error("File does not exist");
          return;
        }
        mutate(data, {
          onSuccess: ({ chats_id }) => {
            toast.success("Chat created successfully: ");
            console.log("FUCK MY LIFE !!",data);
            // Redirect to chat page
            router.push(`/chat/${chats_id}`);
          },
          onError: (error) => {
            toast.error("Error creating chat: ");
            console.error("Error creating chat: ", error);
          },
        });
        console.log("File uploaded to S3: ", data);
      } catch (error) {
        console.error("Error uploading file to S3: ", error);
      } finally {
        setUploading(false);
      }
    },
  });
  return (
    <div className="p-2 bg-white rounded-xl">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
        })}
      >
        <input {...getInputProps()}></input>
        {uploading || isPending ? (
          <>
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin"></Loader2>
            <p className="mt-2 text-sm text-slate-400">
              Giving context to GPT ... Hold tight !
            </p>
          </>
        ) : (
          <>
            <Inbox className="w-10 h-10 text-blue-500"></Inbox>
            <p className="text-sm text-gray-600">
              Drag and drop a PDF file here, or click to select a file.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
