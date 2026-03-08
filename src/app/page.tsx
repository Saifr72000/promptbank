import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainApp } from "@/components/main-app";

export default async function HomePage() {
  const supabase = await createClient();
  
  // Use getUser() for secure server-side validation
  // Note: middleware already checks auth, but we need user.id for queries
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch folders and prompts in parallel for better performance
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
