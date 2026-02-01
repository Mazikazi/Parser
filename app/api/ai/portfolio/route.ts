import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generatePortfolioHTML, PortfolioTheme } from "@/lib/ai/portfolio-generator";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resumeData, theme } = await req.json();

    if (!resumeData) {
      return NextResponse.json({ error: "Resume data is required" }, { status: 400 });
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

    // Generate the HTML structure
    const html = generatePortfolioHTML(resumeData, (theme as PortfolioTheme) || "light");

    return NextResponse.json({ 
      html,
      previewUrl: `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    });
  } catch (error: any) {
    console.error("Portfolio Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
