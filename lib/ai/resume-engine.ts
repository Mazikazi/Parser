export interface ParsedResume {
  personal_info: {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    links: { label: string; url: string }[];
  };
  professional_summary: string;
  skills: {
    technical: string[];
    soft: string[];
    tools: string[];
  };
  work_experience: {
    role: string;
    company: string;
    duration: string;
    bullet_points: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  certifications: string[];
  projects: {
    title: string;
    description: string;
    link?: string;
  }[];
}

export interface ResumeAnalysis {
  ats_score: number;
  keyword_match_percentage: number;
  matched_keywords: string[];
  missing_keywords: string[];
  weak_placements: string[];
  overused_keywords: string[];
  improvement_suggestions: {
    section: string;
    suggestion: string;
    rewritten_bullet?: string;
  }[];
}

export async function analyzeResume(resumeText: string, targetKeywords: string[]) {
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
          content: `You are an advanced AI Resume Analyzer and ATS Optimizer. 
          Your task is to:
          1. Parse the provided resume text into a highly structured JSON format.
          2. Analyze the resume against the provided target keywords: [${targetKeywords.join(", ")}].
          3. Calculate an ATS compatibility score (0-100).
          4. Identify matched, missing, and overused keywords.
          5. Provide specific improvement suggestions, including rewriting weak bullet points using the STAR method.
          
          Constraints:
          - Never hallucinate experience.
          - Normalize skill names (e.g., "JS" -> "JavaScript").
          - Ensure the output is valid JSON.
          
          Return the response in this JSON structure:
          {
            "parsed_resume": { ...ParsedResume structure... },
            "analysis": { ...ResumeAnalysis structure... }
          }`
        },
        {
          role: "user",
          content: `Resume Text: ${resumeText}\n\nTarget Keywords: ${targetKeywords.join(", ")}`
        }
      ],
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "AI Analysis failed");
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
