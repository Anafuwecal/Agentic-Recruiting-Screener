import pdf from "pdf-parse";
import mammoth from "mammoth";
import fs from "fs/promises";

export async function parseFile(
  filePath: string,
  mimeType: string
): Promise<string> {
  if (mimeType.includes("pdf")) {
    const buffer = await fs.readFile(filePath);
    const data = await pdf(buffer);
    return data.text;
  } else if (mimeType.includes("word") || mimeType.includes("document")) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  return "";
}