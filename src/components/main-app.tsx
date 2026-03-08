"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { FolderSidebar } from "@/components/folder-sidebar";
import { PromptList } from "@/components/prompt-list";
import { PromptEditor } from "@/components/prompt-editor";
import { CommandPalette } from "@/components/command-palette";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Folder, Prompt } from "@/lib/database.types";

type MobileView = "list" | "editor";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Dismiss any login loading toast when dashboard loads
  useEffect(() => {
    toast.dismiss("login-redirect");
  }, []);

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
    setMobileView("editor");
  }, []);

  const handleSelectPrompt = useCallback((promptId: string | null) => {
    setSelectedPromptId(promptId);
    setIsNewPrompt(false);
    if (promptId) {
      setMobileView("editor");
    }
  }, []);

  const handleSavePrompt = useCallback(() => {
    setIsNewPrompt(false);
  }, []);

  const handleDeletePrompt = useCallback(() => {
    setSelectedPromptId(null);
    setIsNewPrompt(false);
    setMobileView("list");
  }, []);

  const handleCancelNewPrompt = useCallback(() => {
    setIsNewPrompt(false);
    setSelectedPromptId(null);
    setMobileView("list");
  }, []);

  const handleBackToList = useCallback(() => {
    setMobileView("list");
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
      <Header 
        userEmail={userEmail} 
        onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        showBackButton={mobileView === "editor"}
        onBackClick={handleBackToList}
      />
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay - starts below header */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 top-14 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        
        {/* Folder Sidebar - Hidden on mobile, shown on lg+ */}
        <div className={cn(
          "flex-shrink-0 transition-all duration-300 ease-in-out",
          "hidden lg:block",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        )}>
          <FolderSidebar
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar - Slides in from left */}
        <div className={cn(
          "fixed left-0 top-14 bottom-0 w-64 z-50 transition-transform duration-300 ease-in-out lg:hidden bg-background",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <FolderSidebar
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={(id) => {
              setSelectedFolderId(id);
              setMobileSidebarOpen(false);
            }}
            collapsed={false}
            onToggleCollapse={() => setMobileSidebarOpen(false)}
          />
        </div>
        
        {/* Prompt List - Full width on mobile when in list view, fixed width on lg+ */}
        <div className={cn(
          "shrink-0 min-w-0 overflow-hidden transition-all duration-300",
          "w-full lg:w-80",
          mobileView === "editor" && "hidden lg:block"
        )}>
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
        
        {/* Editor - Full width on mobile when in editor view, flex-1 on lg+ */}
        <div className={cn(
          "flex-1 min-w-0 h-full",
          mobileView === "list" && "hidden lg:block"
        )}>
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
