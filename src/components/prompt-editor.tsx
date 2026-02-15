"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Trash2, Check, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createPrompt, updatePrompt, deletePrompt } from "@/app/actions";
import { toast } from "sonner";
import type { Prompt, Folder } from "@/lib/database.types";

interface PromptEditorProps {
  prompt: Prompt | null;
  folders: Folder[];
  selectedFolderId: string | null;
  isNew: boolean;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function PromptEditor({
  prompt,
  folders,
  selectedFolderId,
  isNew,
  onSave,
  onDelete,
  onCancel,
}: PromptEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setContent(prompt.content);
      setTags(prompt.tags || []);
      setFolderId(prompt.folder_id);
      setHasChanges(false);
    } else if (isNew) {
      setTitle("");
      setContent("");
      setTags([]);
      setFolderId(selectedFolderId || folders[0]?.id || "");
      setHasChanges(false);
    }
  }, [prompt, isNew, selectedFolderId, folders]);

  const handleChange = useCallback(() => {
    setHasChanges(true);
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (!hasChanges || isNew || !prompt) return;

    const timer = setTimeout(async () => {
      if (!title.trim() || !content.trim()) return;

      setSaving(true);
      const result = await updatePrompt(prompt.id, {
        title,
        content,
        tags,
        folder_id: folderId,
      });
      setSaving(false);

      if (result.error) {
        toast.error(result.error);
      } else {
        setHasChanges(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content, tags, folderId, hasChanges, isNew, prompt]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }
    if (!folderId) {
      toast.error("Please select a folder");
      return;
    }

    setSaving(true);

    if (isNew) {
      const result = await createPrompt({
        folder_id: folderId,
        title,
        content,
        tags,
      });

      if (result.error) {
        toast.error(result.error);
        setSaving(false);
        return;
      }

      toast.success("Prompt created");
    } else if (prompt) {
      const result = await updatePrompt(prompt.id, {
        title,
        content,
        tags,
        folder_id: folderId,
      });

      if (result.error) {
        toast.error(result.error);
        setSaving(false);
        return;
      }

      toast.success("Prompt saved");
    }

    setSaving(false);
    setHasChanges(false);
    onSave();
  };

  const handleDelete = async () => {
    if (!prompt) return;

    setSaving(true);
    const result = await deletePrompt(prompt.id);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Prompt deleted");
    setIsDeleteOpen(false);
    onDelete();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
        handleChange();
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    handleChange();
  };

  if (!prompt && !isNew) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Select a prompt</p>
          <p className="text-sm mt-1">Choose a prompt from the list or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">
          {isNew ? "New Prompt" : "Edit Prompt"}
          {saving && <span className="text-sm font-normal text-muted-foreground ml-2">Saving...</span>}
          {hasChanges && !saving && <span className="text-sm font-normal text-muted-foreground ml-2">Unsaved changes</span>}
        </h2>
        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter prompt title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              handleChange();
            }}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground text-right">{title.length}/200</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="folder">Folder</Label>
          <Select value={folderId} onValueChange={(v) => { setFolderId(v); handleChange(); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select a folder" />
            </SelectTrigger>
            <SelectContent>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: folder.color || "#6366f1" }}
                    />
                    {folder.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex-1">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            placeholder="Enter your prompt content..."
            className="min-h-[300px] resize-none"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleChange();
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                {tag} x
              </Badge>
            ))}
          </div>
          <Input
            id="tags"
            placeholder="Add tags (press Enter or comma)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
          />
        </div>
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        {isNew && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : isNew ? "Create Prompt" : "Save Changes"}
        </Button>
      </div>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{prompt?.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
