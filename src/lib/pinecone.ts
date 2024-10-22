import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { TextEncoder } from "util";
import { getEmbeddings } from "./embeddings";
import md5 from "md5";
import { convertToAscii } from "./utils";
import { get_image_summary } from "./img_summary";


let pinecone : Pinecone | null = null;

export const getPineconeClient = () => {
  return new Pinecone({
    // environment : process.env.PINECONE_ENVIRONMENT!,
    apiKey: process.env.PINECONE_API_KEY!,
  });
};

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function loadS3intoPinecone(fileKey: string) {
  // Loading the PDF from S3 into Pinecone ::
  console.log("Loading S3 into Pinecone :: " + fileKey);
  const file_name = await downloadFromS3(fileKey);
  if (!file_name) {
    throw new Error("Could not load S3 into pinecone");
  }

  const img_data = await get_image_summary(file_name); // get image summaries as a list

  console.log("Printing Image Data",img_data)

  const loader = new PDFLoader(file_name);
  const pages = (await loader.load()) as PDFPage[];

  // Splitting the file into chunks ::
  // return pages;
  const documents = await Promise.all(pages.map(prepareDocuments)); 

  // Vectorize and Embed the documents ::
  const vectors = await Promise.all(documents.flat().map(embedDocument));
  const img_vectors = await Promise.all(img_data.map(embedImageSummary)); // get image vectors

  // console.log("Text Vectors Length:", vectors.length);
  console.log("Image Vectors Length:", img_vectors.length);
  // console.log("Text Vectors:", vectors);
  console.log("Image Vectors:", img_vectors);

  const client =  getPineconeClient();
  const pineconeIndex =  client.Index("chat-with-pdf");
  const namespace = pineconeIndex.namespace(convertToAscii(fileKey));
  console.log("<------Upsert to Pinecone Index------>");
  await namespace.upsert(vectors);
  await namespace.upsert(img_vectors); // store image vectors to Pinecone
  
  console.log("<------Done Upserting to Pinecone Index------>");
  return documents[0];  //return first document;
}

async function embedImageSummary(img_data : any) {
  try {
    const embeddings = await getEmbeddings(img_data.text);
    const hash = md5(img_data.text);
    return {
      id: hash,
      values: embeddings,
      metadata: {
        pageNumber: img_data.pageNumber,
        text: img_data.text,
      },
    } as PineconeRecord;
  } catch (error) {
    console.log("Error embedding the Docs", error);
    throw error;
  }
}
async function embedDocument(doc: Document) {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);
    return {
      id: hash,
      values: embeddings,
      metadata: {
        pageNumber: doc.metadata.pageNumber,
        text: doc.metadata.text,
      },
    } as PineconeRecord;
  } catch (error) {
    console.log("Error embedding the Docs", error);
    throw error;
  }
}


export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8 ").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocuments(page: PDFPage) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, "");
  //Doc Splitting ::
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);
  return docs;
}
