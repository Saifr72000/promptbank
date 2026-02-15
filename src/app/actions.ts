"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { FolderInsert, FolderUpdate, PromptInsert, PromptUpdate } from "@/lib/database.types";

// Folder Actions
export async function createFolder(data: { name: string; color?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }

  const folderData: FolderInsert = {
    name: data.name,
    color: data.color || "#6366f1",
    user_id: user.id,
  };

  const { data: folder, error } = await supabase
    .from("folders")
    .insert(folderData)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { data: folder };
}

export async function updateFolder(id: string, data: FolderUpdate) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: folder, error } = await supabase
    .from("folders")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { data: folder };
}

export async function deleteFolder(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function getFolders() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated", data: [] };
  }

  const { data: folders, error } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: folders || [] };
}

// Prompt Actions
export async function createPrompt(data: {
  folder_id: string;
  title: string;
  content: string;
  tags?: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }

  const promptData: PromptInsert = {
    folder_id: data.folder_id,
    title: data.title,
    content: data.content,
    tags: data.tags || [],
    user_id: user.id,
  };

  const { data: prompt, error } = await supabase
    .from("prompts")
    .insert(promptData)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { data: prompt };
}

export async function updatePrompt(id: string, data: PromptUpdate) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: prompt, error } = await supabase
    .from("prompts")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { data: prompt };
}

export async function deletePrompt(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("prompts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function getPrompts(folderId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated", data: [] };
  }

  let query = supabase
    .from("prompts")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (folderId) {
    query = query.eq("folder_id", folderId);
  }

  const { data: prompts, error } = await query;

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: prompts || [] };
}

export async function searchPrompts(query: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated", data: [] };
  }

  // Use full-text search
  const { data: prompts, error } = await supabase
    .from("prompts")
    .select("*, folders(name, color)")
    .eq("user_id", user.id)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order("updated_at", { ascending: false });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: prompts || [] };
}

// Export/Import
export async function exportPrompts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: folders } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", user.id);

  const { data: prompts } = await supabase
    .from("prompts")
    .select("*")
    .eq("user_id", user.id);

  return {
    data: {
      exportedAt: new Date().toISOString(),
      folders: folders || [],
      prompts: prompts || [],
    },
  };
}

export async function importPrompts(jsonData: {
  folders: Array<{ name: string; color?: string }>;
  prompts: Array<{ folder_name: string; title: string; content: string; tags?: string[] }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Create folders first
  const folderMap = new Map<string, string>();
  
  for (const folder of jsonData.folders) {
    const { data } = await supabase
      .from("folders")
      .insert({ name: folder.name, color: folder.color, user_id: user.id })
      .select()
      .single();
    
    if (data) {
      folderMap.set(folder.name, data.id);
    }
  }

  // Create prompts
  for (const prompt of jsonData.prompts) {
    const folderId = folderMap.get(prompt.folder_name);
    if (folderId) {
      await supabase.from("prompts").insert({
        folder_id: folderId,
        title: prompt.title,
        content: prompt.content,
        tags: prompt.tags || [],
        user_id: user.id,
      });
    }
  }

  revalidatePath("/");
  return { success: true };
}

// Auth
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
}
