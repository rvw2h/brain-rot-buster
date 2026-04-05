import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const CATEGORIES = [
  'product_req',
  'user_complaint',
  'business_rule',
  'meeting_notes',
  'data_snapshot'
];

async function generateErrorSpotters() {
  console.log("Generating Error Spotters...");
  const prompt = `
Generate 20 high-quality "Error Spotter" scenarios for a precision training game.
Each scenario must:
- Be 1–3 sentences max
- Contain exactly one deliberate error (date/day mismatch, wrong arithmetic, wrong order, contradicting rule, impossible condition)
- Feel realistic — use Indian context (₹, IST, Indian names, Indian calendar)
- Include: stimulus text, the question ("What is wrong here?"), correct_answer, explanation

Return as JSON object with a "scenarios" key. No markdown. No preamble.
Schema: [{ stimulus, question, correct_answer, explanation, error_type }]
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(completion.choices[0]?.message?.content || "{}");
    const list = content.scenarios || content.items || content.error_spotters || [];
    
    const prepared = list.map((item: any) => ({
      type: 'error_spotter',
      stimulus: item.stimulus,
      question: item.question,
      correct: item.correct_answer,
      explanation: item.explanation,
      week_index: 0
    }));

    const { error } = await supabase.from('sharp_eye_questions').insert(prepared);
    if (error) console.error("Error inserting spotters:", error);
    else console.log(`Successfully inserted ${prepared.length} error spotters.`);
  } catch (err) {
    console.error("Failed to generate error spotters:", err);
  }
}

async function generateAuditScenarios(category: string) {
  console.log(`Generating 10 Audit scenarios for ${category}...`);
  const prompt = `
Generate 10 complex "Audit" scenarios for a precision training game targeting product managers. 
Category: ${category}.
Each scenario must:
- Be 60–100 words, realistic business context (Indian names/context where relevant).
- Contain exactly 3 questions.
- Each question must have 4 options (A/B/C/D).
- At least 2 questions per scenario must use one of these traps: condition_trap, omission_trap, number_trap, assumption_trap.
- One correct answer per question, clearly specified.
- Indian business context where relevant.

Return as JSON object with a "scenarios" key. No markdown. No preamble.
Schema: [{ category, brief, questions: [{ question, options, correct, trap_type, explanation }] }]
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(completion.choices[0]?.message?.content || "{}");
    const scenarios = content.scenarios || [];

    const prepared = scenarios.map((s: any) => ({
      category,
      brief: s.brief,
      questions: s.questions,
      week_index: 0
    }));

    const { error } = await supabase.from('audit_scenarios').insert(prepared);
    if (error) console.error(`Error inserting ${category}:`, error);
    else console.log(`Successfully inserted ${prepared.length} audit scenarios for ${category}.`);
  } catch (err) {
    console.error(`Failed to generate ${category}:`, err);
  }
}

async function main() {
  await generateErrorSpotters();
  for (const cat of CATEGORIES) {
    await generateAuditScenarios(cat);
  }
  console.log("Seeding complete.");
}

main();
