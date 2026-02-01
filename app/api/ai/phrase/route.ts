import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, tone, content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Check credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.credits < 1) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    // Deduct credit
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: profile.credits - 1 })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });
    }

    // Call Longcat AI (OpenAI compatible)
    const response = await fetch("https://api.longcat.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LONGCAT_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert resume writer. Rewrite the following resume bullet points for a ${role} role with a ${tone} tone. 
            Use strong action verbs, quantify achievements where possible, and ensure ATS-friendliness. 
            Return only the rewritten bullet points, one per line.`
          },
          {
            role: "user",
            content: content
          }
        ],
      }),
    });

    const aiData = await response.json();
    const rewrittenContent = aiData.choices[0].message.content;

    return NextResponse.json({ content: rewrittenContent });
  } catch (error: any) {
    console.error("AI Phrase Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
