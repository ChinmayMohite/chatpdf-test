import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function deleteFromS3(file_key: string) {
  // Initialize the S3 client
  const s3Client = new S3Client({
    region: 'ap-south-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_KEY!,
    },
  });

  // Define the parameters for the delete operation
  const params = {
    Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
    Key: file_key,
  };

  try {
    // Create the command and send it
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    console.log('Delete Completed:', file_key);
  } catch (error) {
    console.error('Failed to delete from S3:', error);
  }
}
