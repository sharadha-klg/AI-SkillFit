// Lovable AI edge function for SkillFit interview question generation and final evaluation
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(body: unknown) {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI gateway ${res.status}: ${txt}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { action, preAssessment, history, transcript, trustScore, language } = await req.json();
    const lang = language || "English";

    if (action === "next_question") {
      const sys = `You are an AI job interviewer for SkillFit. Generate ONE concise interview question (under 30 words) tailored to the candidate's profile and adapt difficulty based on prior answers. Write the question in ${lang}. Return ONLY the question text, no preamble.`;
      const userMsg = `Candidate profile:
Role: ${preAssessment.job_role}
Experience: ${preAssessment.experience} years
Domains: ${preAssessment.domains}
Skills: ${preAssessment.skills}
Qualification: ${preAssessment.qualification}
Confidence: ${preAssessment.confidence}

Conversation so far:
${(history || []).map((h: any, i: number) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`).join("\n")}

Generate the next question. ${history?.length >= 0 ? `This is question ${(history?.length || 0) + 1} of 5.` : ""}`;
      const data = await callAI({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
      });
      const question = data.choices?.[0]?.message?.content?.trim() || "Tell me about yourself.";
      return new Response(JSON.stringify({ question }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "evaluate") {
      const sys = `You evaluate job interview transcripts. Write candidate_feedback and admin_evaluation.summary/strengths/weaknesses in ${lang}. Return JSON via the provided tool only.`;
      const userMsg = `Candidate profile:
${JSON.stringify(preAssessment)}

Trust score during interview: ${trustScore}/100

Transcript:
${transcript.map((t: any, i: number) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer}`).join("\n\n")}

Evaluate the candidate's job fit, communication, confidence, and domain knowledge. If trust score < 50 consider fraud_suspected. If answers are very weak consider training_needed. If excellent: job_fit.`;
      const data = await callAI({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
        tools: [{
          type: "function",
          function: {
            name: "submit_evaluation",
            description: "Submit final candidate evaluation",
            parameters: {
              type: "object",
              properties: {
                fit_score: { type: "number", description: "0-100 job fit score" },
                status: { type: "string", enum: ["job_fit", "training_needed", "manual_review", "low_confidence", "fraud_suspected"] },
                candidate_feedback: { type: "string", description: "Soft, encouraging 2-sentence feedback for the candidate" },
                admin_evaluation: {
                  type: "object",
                  properties: {
                    communication: { type: "number" },
                    confidence: { type: "number" },
                    domain_knowledge: { type: "number" },
                    strengths: { type: "array", items: { type: "string" } },
                    weaknesses: { type: "array", items: { type: "string" } },
                    summary: { type: "string" },
                  },
                  required: ["communication", "confidence", "domain_knowledge", "strengths", "weaknesses", "summary"],
                },
                flags: { type: "array", items: { type: "string" } },
              },
              required: ["fit_score", "status", "candidate_feedback", "admin_evaluation", "flags"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_evaluation" } },
      });
      const tc = data.choices?.[0]?.message?.tool_calls?.[0];
      const result = tc ? JSON.parse(tc.function.arguments) : null;
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (e) {
    console.error("interview-ai error", e);
    const msg = e instanceof Error ? e.message : "Unknown";
    const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
