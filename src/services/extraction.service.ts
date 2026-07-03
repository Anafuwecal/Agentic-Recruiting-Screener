import * as pdfParse from "pdf-parse";
import mammoth from "mammoth";
import AdmZip from "adm-zip";
import type { IZipEntry } from "adm-zip";
import * as cheerio from "cheerio";
import axios from "axios";
import fs from "fs";

export class ExtractionService {
  // 1. PDF & DOCX Parsing
  public static async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    
    if (mimeType === "application/pdf") {
      const pdfData = await (pdfParse as any).default(buffer);
      return pdfData.text;
    } 
    
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const docxData = await mammoth.extractRawText({ buffer });
      return docxData.value;
    }
    
    throw new Error("Unsupported file format. Please upload PDF or DOCX.");
  }

  // 2. Zip Folder Parsing (For coding assessments)
  public static extractCodeFromZip(zipFilePath: string): string {
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();
    let combinedCode = "";

    zipEntries.forEach((entry: IZipEntry) => {
      // Skip node_modules, build folders, and hidden files
      if (!entry.isDirectory && !entry.entryName.includes("node_modules/") && !entry.entryName.startsWith(".")) {
        combinedCode += `\n\n--- FILE: ${entry.entryName} ---\n`;
        combinedCode += entry.getData().toString("utf8");
      }
    }); 

    return combinedCode;
  }

  // 3. Link Scraper (GitHub, Portfolios)
  public static async scrapeUrl(url: string): Promise<string> {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      // Remove scripts, styles, and html tags to get clean text
      $("script, style, noscript").remove();
      return $("body").text().replace(/\s+/g, " ").trim();
    } catch (error) {
      console.error(`Failed to scrape URL ${url}:`, error);
      return `[Failed to fetch content from ${url}]`;
    }
  }
}