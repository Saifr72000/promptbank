"use client";

import { useState } from "react";
import { Eye, EyeOff, Key, Lock, ArrowLeft, Sparkles, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { saveSettings, updatePassword } from "@/app/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { UserSettings } from "@/lib/database.types";

const DEFAULT_SYSTEM_PROMPT = `You are an expert prompt engineer. Your job is to take a user's rough idea, topic, or draft content and transform it into an exceptionally detailed, well-structured, and highly effective prompt.

Guidelines:
- Output ONLY the final prompt — no explanations, no preamble, no meta-commentary, no "Here is your prompt:" prefix.
- Be thorough and comprehensive. A good prompt is detailed, not short. Expand on the user's idea significantly.
- Clearly define the role, task, context, constraints, and desired output format inside the prompt.
- Add relevant depth: include sub-tasks, edge cases, output structure, tone, length expectations, and any other details that would make the AI response better.
- Use clear, precise language. Avoid vague instructions.
- If the user's content already has structure, preserve and enhance it.
- The prompt should be long enough to fully capture the intent — do not truncate or summarize.`;

const DEFAULT_MAX_TOKENS = 4096;

interface SettingsPageProps {
  userEmail: string;
  initialSettings: UserSettings | null;
}

export function SettingsPage({ userEmail, initialSettings }: SettingsPageProps) {
  const router = useRouter();

  // API Keys state
  const [openaiKey, setOpenaiKey] = useState(initialSettings?.openai_api_key || "");
  const [anthropicKey, setAnthropicKey] = useState(initialSettings?.anthropic_api_key || "");
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);

  // Generation settings state
  const [systemPrompt, setSystemPrompt] = useState(
    initialSettings?.system_prompt || DEFAULT_SYSTEM_PROMPT
  );
  const [maxOutputTokens, setMaxOutputTokens] = useState(
    initialSettings?.max_output_tokens ?? DEFAULT_MAX_TOKENS
  );
  const [savingGeneration, setSavingGeneration] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveApiKeys = async () => {
    setSavingKeys(true);
    const result = await saveSettings({
      openai_api_key: openaiKey.trim() || null,
      anthropic_api_key: anthropicKey.trim() || null,
    });
    setSavingKeys(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("API keys saved");
  };

  const handleSaveGeneration = async () => {
    const tokens = Number(maxOutputTokens);
    if (!tokens || tokens < 256 || tokens > 32000) {
      toast.error("Max output tokens must be between 256 and 32000");
      return;
    }

    setSavingGeneration(true);
    const result = await saveSettings({
      system_prompt: systemPrompt.trim() || null,
      max_output_tokens: tokens,
    });
    setSavingGeneration(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Generation settings saved");
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSavingPassword(true);
    const result = await updatePassword(newPassword);
    setSavingPassword(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Password updated successfully");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b px-4 flex items-center gap-3 bg-background">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white dark:text-zinc-900" />
        </div>
        <h1 className="text-lg font-bold">Promptbank</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground mt-1">{userEmail}</p>
        </div>

        {/* API Keys Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">API Keys</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Your API keys are stored securely and used when generating prompts with AI. They are never shared or exposed to the browser.
          </p>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <p className="text-xs text-muted-foreground">
                Used for GPT-4o and GPT-4o Mini. Get yours at{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-4"
                >
                  platform.openai.com
                </a>
              </p>
              <div className="relative">
                <Input
                  id="openai-key"
                  type={showOpenai ? "text" : "password"}
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowOpenai((v) => !v)}
                >
                  {showOpenai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anthropic-key">Anthropic API Key</Label>
              <p className="text-xs text-muted-foreground">
                Used for Claude models. Get yours at{" "}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-4"
                >
                  console.anthropic.com
                </a>
              </p>
              <div className="relative">
                <Input
                  id="anthropic-key"
                  type={showAnthropic ? "text" : "password"}
                  placeholder="sk-ant-..."
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAnthropic((v) => !v)}
                >
                  {showAnthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button onClick={handleSaveApiKeys} disabled={savingKeys}>
              {savingKeys ? "Saving..." : "Save API Keys"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Generation Settings Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Generation Settings</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Control how the AI generates prompts. Changes apply to all future generations.
          </p>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                >
                  Reset to default
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This instructs the AI on how to generate prompts from your content.
              </p>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[200px] font-mono text-sm resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-tokens">Max Output Tokens</Label>
              <p className="text-xs text-muted-foreground">
                Maximum number of tokens the AI can generate. Higher values allow longer prompts. Range: 256 – 32000.
              </p>
              <Input
                id="max-tokens"
                type="number"
                min={256}
                max={32000}
                step={256}
                value={maxOutputTokens}
                onChange={(e) => setMaxOutputTokens(Number(e.target.value))}
                className="w-40"
              />
            </div>

            <Button onClick={handleSaveGeneration} disabled={savingGeneration}>
              {savingGeneration ? "Saving..." : "Save Generation Settings"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Password Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Change Password</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Update the password for your account.
          </p>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword((v) => !v)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button onClick={handleUpdatePassword} disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
