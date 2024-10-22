// Import necessary modules
import { PineconeRecord } from "@pinecone-database/pinecone";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { UnstructuredClient } from "unstructured-client";
import { PartitionResponse } from "unstructured-client/sdk/models/operations";
import { Strategy } from "unstructured-client/sdk/models/shared";
import * as fs from "fs";
import { config } from "dotenv";
import md5 from "md5";

config();

const key = process.env.UNSTRUCTURED_API_KEY;
const url = process.env.UNSTRUCTURED_API_URL;

const client = new UnstructuredClient({
  serverURL: url,
  security: {
    apiKeyAuth: key,
  },
});

const vision_model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
});

export async function get_image_summary(file_name: string) {
  try {
    const filename = file_name;
    const data = fs.readFileSync(filename);

    const res: PartitionResponse = await client.general.partition({
      partitionParameters: {
        files: {
          //@ts-ignore
          content: data,
          fileName: filename,
        },
        strategy: Strategy.HiRes,
        splitPdfPage: true,
        splitPdfAllowFailed: true,
        splitPdfConcurrencyLevel: 15,
        extractImageBlockTypes: ["Image"], // Adjust this if needed
      },
    });

    if (res.statusCode === 200 && res.elements) {
      let img_data: any[] = [];

      // Iterate over the partitioned elements
      for (const element of res.elements) {
        if (element.metadata?.image_base64) {
          try {
            const base64_image = element.metadata.image_base64;
            const prompt = `Provide a detailed summary of the image's visual content. Describe the key objects, colors, 
                  themes, and any notable features visible in the image. Mention the page number and image number.`;
            
            const msg = new HumanMessage({
              content: [
                {
                  type: "text",
                  text: `${prompt} (This image is located on page ${element.metadata.pageNumber}.)`,
                },
                {
                  type: "image_url",
                  image_url: { url: `data:image/jpeg;base64,${base64_image}` },
                },
              ],
            });

            // Call the vision model to generate the image summary
            const image_summary = await vision_model.invoke([msg]);

            img_data.push({
              pageNumber: element.metadata.pageNumber,
              text: image_summary.content,
            });
          } catch (error) {
            console.error("Error processing image on page:", element.metadata.pageNumber, error);
          }
        } else {
          console.warn("No image data found in element on page:", element.metadata?.pageNumber);
        }
      }

      return img_data;
    } 
    else if (res.statusCode !== 200) {
      throw new Error(`Unexpected status code: ${res.statusCode}`);
    }else {
      console.error("Error in partitioning or empty response.");
      return [];
    }
  } catch (error) {
    console.error("Error in get_image_summary function:", error);
    return [];
  }
}
