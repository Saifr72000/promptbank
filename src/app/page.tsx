import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainApp } from "@/components/main-app";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch initial data
  const [foldersResult, promptsResult] = await Promise.all([
    supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("prompts")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <MainApp
      userEmail={user.email || ""}
      initialFolders={foldersResult.data || []}
      initialPrompts={promptsResult.data || []}
    />
  );
}
