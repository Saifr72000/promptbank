"use client";

import { useState } from "react";
import { LogOut, Download, Upload, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { signOut, exportPrompts, importPrompts } from "@/app/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface HeaderProps {
  userEmail: string;
}

export function Header({ userEmail }: HeaderProps) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importData, setImportData] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const handleExport = async () => {
    setLoading(true);
    const result = await exportPrompts();
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const dataStr = JSON.stringify(result.data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promptbank-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Export downloaded");
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      toast.error("Please paste your export data");
      return;
    }

    try {
      const data = JSON.parse(importData);
      
      if (!data.folders || !data.prompts) {
        toast.error("Invalid export format");
        return;
      }

      // Transform to import format
      const importPayload = {
        folders: data.folders.map((f: { name: string; color?: string }) => ({
          name: f.name,
          color: f.color,
        })),
        prompts: data.prompts.map((p: { title: string; content: string; tags?: string[]; folder_id: string }) => {
          const folder = data.folders.find((f: { id: string; name: string }) => f.id === p.folder_id);
          return {
            folder_name: folder?.name || "Imported",
            title: p.title,
            content: p.content,
            tags: p.tags,
          };
        }),
      };

      setLoading(true);
      const result = await importPrompts(importPayload);
      setLoading(false);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Import successful");
      setImportData("");
      setIsImportOpen(false);
      router.refresh();
    } catch {
      toast.error("Invalid JSON format");
    }
  };

  return (
    <header className="h-14 border-b px-4 flex items-center justify-between bg-background">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">Promptbank</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleExport} disabled={loading}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setIsImportOpen(true)}>
          <Upload className="h-4 w-4 mr-1" />
          Import
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4 mr-1" />
              {userEmail}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Prompts</DialogTitle>
            <DialogDescription>
              Paste your exported JSON data below. This will create new folders and prompts.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Paste your export JSON here..."
            className="min-h-[300px] font-mono text-sm"
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={loading}>
              {loading ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
