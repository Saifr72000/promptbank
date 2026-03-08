import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are an expert prompt engineer. Your job is to take a user's rough idea, topic, or draft content and transform it into an exceptionally detailed, well-structured, and highly effective prompt.

Guidelines:
- Output ONLY the final prompt — no explanations, no preamble, no meta-commentary, no "Here is your prompt:" prefix.
- Be thorough and comprehensive. A good prompt is detailed, not short. Expand on the user's idea significantly.
- Clearly define the role, task, context, constraints, and desired output format inside the prompt.
- Add relevant depth: include sub-tasks, edge cases, output structure, tone, length expectations, and any other details that would make the AI response better.
- Use clear, precise language. Avoid vague instructions.
- If the user's content already has structure, preserve and enhance it.
- The prompt should be long enough to fully capture the intent — do not truncate or summarize.`;

const OPENAI_MODELS = new Set(["gpt-4o", "gpt-4o-mini"]);

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { content, model } = await req.json();

  if (!content?.trim()) {
    return new Response("Content is required", { status: 400 });
  }
  if (!model) {
    return new Response("Model is required", { status: 400 });
  }

  // Fetch the user's stored settings
  const { data: settings } = await supabase
    .from("user_settings")
    .select("openai_api_key, anthropic_api_key, system_prompt, max_output_tokens")
    .eq("user_id", user.id)
    .maybeSingle();

  const isOpenAI = OPENAI_MODELS.has(model);

  const apiKey = isOpenAI
    ? (settings?.openai_api_key || process.env.OPENAI_API_KEY)
    : (settings?.anthropic_api_key || process.env.ANTHROPIC_API_KEY);

  if (!apiKey) {
    return new Response(
      isOpenAI
        ? "No OpenAI API key found. Please add your key in Settings."
        : "No Anthropic API key found. Please add your key in Settings.",
      { status: 400 }
    );
  }

  const providerModel = isOpenAI
    ? createOpenAI({ apiKey })(model)
    : createAnthropic({ apiKey })(model);

  const result = streamText({
    model: providerModel,
    system: settings?.system_prompt || SYSTEM_PROMPT,
    prompt: content,
    maxOutputTokens: settings?.max_output_tokens || 4096,
  });

  return result.toTextStreamResponse();
}
