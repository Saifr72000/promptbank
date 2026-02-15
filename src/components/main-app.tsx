"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { FolderSidebar } from "@/components/folder-sidebar";
import { PromptList } from "@/components/prompt-list";
import { PromptEditor } from "@/components/prompt-editor";
import { CommandPalette } from "@/components/command-palette";
import type { Folder, Prompt } from "@/lib/database.types";

interface MainAppProps {
  userEmail: string;
  initialFolders: Folder[];
  initialPrompts: Prompt[];
}

export function MainApp({ userEmail, initialFolders, initialPrompts }: MainAppProps) {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isNewPrompt, setIsNewPrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Update state when props change (after server revalidation)
  useEffect(() => {
    setFolders(initialFolders);
  }, [initialFolders]);

  useEffect(() => {
    setPrompts(initialPrompts);
  }, [initialPrompts]);

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId) || null;

  const handleNewPrompt = useCallback(() => {
    setSelectedPromptId(null);
    setIsNewPrompt(true);
  }, []);

  const handleSelectPrompt = useCallback((promptId: string | null) => {
    setSelectedPromptId(promptId);
    setIsNewPrompt(false);
  }, []);

  const handleSavePrompt = useCallback(() => {
    setIsNewPrompt(false);
  }, []);

  const handleDeletePrompt = useCallback(() => {
    setSelectedPromptId(null);
    setIsNewPrompt(false);
  }, []);

  const handleCancelNewPrompt = useCallback(() => {
    setIsNewPrompt(false);
    setSelectedPromptId(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K - Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Cmd/Ctrl + N - New prompt
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        if (folders.length > 0) {
          handleNewPrompt();
        }
      }
      // Cmd/Ctrl + / - Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search prompts..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [folders.length, handleNewPrompt]);

  return (
    <div className="h-screen flex flex-col">
      <Header userEmail={userEmail} />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 flex-shrink-0">
          <FolderSidebar
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
          />
        </div>
        
        <div className="w-80 flex-shrink-0">
          <PromptList
            prompts={prompts}
            folders={folders}
            selectedPromptId={selectedPromptId}
            selectedFolderId={selectedFolderId}
            onSelectPrompt={handleSelectPrompt}
            onNewPrompt={handleNewPrompt}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
        
        <PromptEditor
          prompt={selectedPrompt}
          folders={folders}
          selectedFolderId={selectedFolderId}
          isNew={isNewPrompt}
          onSave={handleSavePrompt}
          onDelete={handleDeletePrompt}
          onCancel={handleCancelNewPrompt}
        />
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        prompts={prompts}
        folders={folders}
        onSelectPrompt={handleSelectPrompt}
        onSelectFolder={setSelectedFolderId}
        onNewPrompt={handleNewPrompt}
      />
    </div>
  );
}
