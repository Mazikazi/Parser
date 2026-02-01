import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let text = "";

    if (file.type === "application/pdf") {
      const data = await pdf(buffer);
      text = data.text;
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      text = buffer.toString("utf-8");
    }
    
    // Basic cleaning of the text
    const cleanedText = text
      .replace(/\n\s*\n/g, '\n') // Remove multiple empty lines
      .trim();

    return NextResponse.json({ text: cleanedText });
  } catch (error: any) {
    console.error("Resume Parse Error:", error);
    return NextResponse.json({ error: "Failed to parse resume file" }, { status: 500 });
  }
}
