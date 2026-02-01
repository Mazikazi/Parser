import { NextResponse } from "next/server";
import { analyzeResume } from "@/lib/ai/resume-engine";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In a real app, you'd verify the session cookie or ID token
    // For simplicity in this migration, we'll assume the client sends a token in headers or we use a placeholder
    // Ideally: const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // For now, let's assume the user ID is passed or retrieved from a secure way
    // This is a placeholder for the actual auth logic
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { resumeText, keywords } = await req.json();

    if (!resumeText) {
      return NextResponse.json({ error: "Resume text is required" }, { status: 400 });
    }

    // Check credits in Firestore
    const userRef = adminDb.collection("profiles").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create profile if it doesn't exist
      await userRef.set({ credits: 5, updated_at: new Date().toISOString() });
    }

    const userData = userDoc.data();
    const credits = userData?.credits ?? 5;

    if (credits < 1) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    // Deduct credit
    await userRef.update({ credits: credits - 1, updated_at: new Date().toISOString() });

    const result = await analyzeResume(resumeText, keywords || []);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Resume Analysis API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
