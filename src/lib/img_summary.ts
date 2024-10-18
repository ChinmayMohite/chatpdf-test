// Import necessary modules
import { PineconeRecord } from "@pinecone-database/pinecone";
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';
import { UnstructuredClient } from "unstructured-client";
import { PartitionResponse } from "unstructured-client/sdk/models/operations";
import { Strategy } from "unstructured-client/sdk/models/shared";
import * as fs from "fs";
import { config } from 'dotenv';
import { getEmbeddings } from "./embeddings";
import md5 from "md5";
import { and } from "drizzle-orm";
import { stringify } from "querystring";

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
    model:"gemini-1.5-flash",
});

// async function embedSummary(img_summary: string) {
//     try {
//       const embeddings = await getEmbeddings(img_summary);
//       const hash = md5(img_summary);
//       return {
//         id: hash,
//         values: embeddings,
//         metadata: {
//           pageNumber: doc.metadata.pageNumber,
//           text: doc.metadata.text,
//         },
//       } as PineconeRecord;
//     } catch (error) {
//       console.log("Error embedding the Docs", error);
//       throw error;
//     }
//   }


export async function get_image_summary (file_name: string){

    const filename = file_name;
    const data = fs.readFileSync(filename);

    const res: PartitionResponse = await client.general.partition({
        partitionParameters: {
            files: {
                content: data,
                fileName: filename, 
            },
            strategy: Strategy.HiRes,
            splitPdfPage: true,
            splitPdfAllowFailed: true,
            splitPdfConcurrencyLevel: 15,
            extractImageBlockTypes : ["Image", "Table"],
        }
    });
    if (res.statusCode == 200) {
            
        let img_data: any [] = [];

        res.elements?.forEach(async (element: any) => {
            if (element.metadata?.image_base64) {
                try {
                    const base64_image = element.metadata.image_base64
                    const prompt = `You are an assistant tasked with summarizing images for retrieval. 
                                    These summaries will be embedded and used to retrieve the raw image.
                                    Provide a detailed description of the image in more than 50 words.
                                    Also keep a track of the page number on which the image is present.
                                    Give a concise summary of the image that is well optimized for retrieval. Image {element}`;
                        
                    const msg = new HumanMessage({
                        content:[
                            {
                                "type" : "text" , "text" : prompt 
                            },
                            {
                                "type" : "image_url", "image_url" : {"url" : `data:image/jpeg;base64,${base64_image}`}, 
                            },
                        ]
                    })
                    
                    const image_summary = await vision_model.invoke([msg]);

                    const data = {
                        pageNumber : element.metadata.pageNumber,
                        text : image_summary.content,
                    };

                    img_data.push(data);

                } catch (error) {
                    console.error("Error in embedding the image:", error);
                }
            }
        });
            
        return img_data
    }else{
        console.error("Error in partitioning:");
        return [];
    }
}