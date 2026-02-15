"use client";

import { useEffect, useState } from "react";
import { Copy, FileText, Folder, Plus, Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { toast } from "sonner";
import type { Folder as FolderType, Prompt } from "@/lib/database.types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompts: Prompt[];
  folders: FolderType[];
  onSelectPrompt: (promptId: string) => void;
  onSelectFolder: (folderId: string | null) => void;
  onNewPrompt: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  prompts,
  folders,
  onSelectPrompt,
  onSelectFolder,
  onNewPrompt,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const getFolderName = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    return folder?.name || "Unknown";
  };

  const getFolderColor = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    return folder?.color || "#6366f1";
  };

  const handleCopyPrompt = async (prompt: Prompt) => {
    await navigator.clipboard.writeText(prompt.content);
    toast.success(`Copied "${prompt.title}" to clipboard`);
    onOpenChange(false);
  };

  const filteredPrompts = prompts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search prompts, folders, or type a command..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              onNewPrompt();
              onOpenChange(false);
            }}
            disabled={folders.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Prompt
            <span className="ml-auto text-xs text-muted-foreground">Cmd+N</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onSelectFolder(null);
              onOpenChange(false);
            }}
          >
            <Search className="mr-2 h-4 w-4" />
            View All Prompts
          </CommandItem>
        </CommandGroup>

        {filteredFolders.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Folders">
              {filteredFolders.map((folder) => (
                <CommandItem
                  key={folder.id}
                  onSelect={() => {
                    onSelectFolder(folder.id);
                    onOpenChange(false);
                  }}
                >
                  <div
                    className="mr-2 h-3 w-3 rounded-full"
                    style={{ backgroundColor: folder.color || "#6366f1" }}
                  />
                  {folder.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredPrompts.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Prompts">
              {filteredPrompts.slice(0, 10).map((prompt) => (
                <CommandItem
                  key={prompt.id}
                  onSelect={() => {
                    onSelectPrompt(prompt.id);
                    onOpenChange(false);
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{prompt.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getFolderName(prompt.folder_id)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPrompt(prompt);
                    }}
                    className="ml-2 p-1 hover:bg-muted rounded"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </CommandItem>
              ))}
              {filteredPrompts.length > 10 && (
                <CommandItem disabled>
                  <span className="text-muted-foreground">
                    +{filteredPrompts.length - 10} more results...
                  </span>
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
