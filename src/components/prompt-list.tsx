"use client";

import { useState } from "react";
import { Plus, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Prompt, Folder } from "@/lib/database.types";

interface PromptListProps {
  prompts: Prompt[];
  folders: Folder[];
  selectedPromptId: string | null;
  selectedFolderId: string | null;
  onSelectPrompt: (promptId: string | null) => void;
  onNewPrompt: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function PromptList({
  prompts,
  folders,
  selectedPromptId,
  selectedFolderId,
  onSelectPrompt,
  onNewPrompt,
  searchQuery,
  onSearchChange,
}: PromptListProps) {
  const getFolderColor = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    return folder?.color || "#6366f1";
  };

  const getFolderName = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    return folder?.name || "Unknown";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch =
      !searchQuery ||
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFolder = !selectedFolderId || prompt.folder_id === selectedFolderId;
    
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Prompts</h2>
          <Button size="sm" onClick={onNewPrompt} disabled={folders.length === 0}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filteredPrompts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            {folders.length === 0 ? (
              <>
                <p className="font-medium">No folders yet</p>
                <p className="text-sm mt-1">Create a folder first to add prompts</p>
              </>
            ) : searchQuery ? (
              <>
                <p className="font-medium">No prompts found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </>
            ) : (
              <>
                <p className="font-medium">No prompts yet</p>
                <p className="text-sm mt-1">Click &quot;New&quot; to create your first prompt</p>
              </>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredPrompts.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => onSelectPrompt(prompt.id)}
                className={cn(
                  "w-full text-left p-3 rounded-md transition-colors",
                  selectedPromptId === prompt.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{prompt.title}</p>
                    <p
                      className={cn(
                        "text-sm truncate mt-0.5",
                        selectedPromptId === prompt.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {prompt.content.slice(0, 100)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {!selectedFolderId && (
                    <div className="flex items-center gap-1">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: getFolderColor(prompt.folder_id) }}
                      />
                      <span
                        className={cn(
                          "text-xs",
                          selectedPromptId === prompt.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {getFolderName(prompt.folder_id)}
                      </span>
                    </div>
                  )}
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {prompt.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant={selectedPromptId === prompt.id ? "secondary" : "outline"}
                          className="text-xs px-1.5 py-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {prompt.tags.length > 2 && (
                        <span
                          className={cn(
                            "text-xs",
                            selectedPromptId === prompt.id
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          +{prompt.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  <span
                    className={cn(
                      "text-xs ml-auto",
                      selectedPromptId === prompt.id
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatDate(prompt.updated_at)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
