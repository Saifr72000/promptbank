"use client";

import { useState } from "react";
import { Folder, FolderOpen, MoreHorizontal, Plus, Pencil, Trash2, PanelLeftClose, PanelLeft, ChevronRight, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createFolder, updateFolder, deleteFolder } from "@/app/actions";
import { toast } from "sonner";
import type { Folder as FolderType } from "@/lib/database.types";

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e",
];

interface FolderSidebarProps {
  folders: FolderType[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface FolderTreeNode extends FolderType {
  children: FolderTreeNode[];
}

function buildTree(folders: FolderType[]): FolderTreeNode[] {
  const map = new Map<string, FolderTreeNode>();
  const roots: FolderTreeNode[] = [];

  for (const folder of folders) {
    map.set(folder.id, { ...folder, children: [] });
  }

  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

interface FolderNodeProps {
  node: FolderTreeNode;
  depth: number;
  selectedFolderId: string | null;
  onSelectFolder: (id: string) => void;
  onAddSubfolder: (parentFolder: FolderType) => void;
  onEdit: (folder: FolderType) => void;
  onDelete: (folder: FolderType) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}

function FolderNode({
  node,
  depth,
  selectedFolderId,
  onSelectFolder,
  onAddSubfolder,
  onEdit,
  onDelete,
  expandedIds,
  onToggleExpand,
}: FolderNodeProps) {
  const isSelected = selectedFolderId === node.id;
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 py-1.5 rounded-md text-sm transition-colors cursor-pointer pr-1",
          isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelectFolder(node.id)}
      >
        <button
        className={cn(
          "shrink-0 h-4 w-4 flex items-center justify-center rounded transition-colors",
            !hasChildren && "invisible"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(node.id);
          }}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        {hasChildren && isExpanded ? (
          <FolderOpen
            className="h-4 w-4 shrink-0"
            style={{ color: isSelected ? "currentColor" : (node.color || "#6366f1") }}
          />
        ) : (
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: node.color || "#6366f1" }}
          />
        )}

        <span className="flex-1 truncate">{node.name}</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                isSelected && "text-primary hover:text-primary hover:bg-primary/20"
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onAddSubfolder(node);
              }}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Add Subfolder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(node);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isSelected && (
        <button
          className="w-full flex items-center gap-1 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          style={{ paddingLeft: `${8 + (depth + 1) * 16}px` }}
          onClick={(e) => {
            e.stopPropagation();
            onAddSubfolder(node);
          }}
        >
          <Plus className="h-3 w-3" />
          <span>Add Subfolder</span>
        </button>
      )}

      {(hasChildren && isExpanded) && (
        <div>
          {node.children.map((child) => (
            <FolderNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onAddSubfolder={onAddSubfolder}
              onEdit={onEdit}
              onDelete={onDelete}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderSidebar({ folders, selectedFolderId, onSelectFolder, collapsed = false, onToggleCollapse }: FolderSidebarProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [parentFolderForNew, setParentFolderForNew] = useState<FolderType | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#6366f1");
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const tree = buildTree(folders);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openCreateDialog = (parent: FolderType | null = null) => {
    setParentFolderForNew(parent);
    setNewFolderName("");
    setNewFolderColor("#6366f1");
    setIsCreateOpen(true);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name is required");
      return;
    }

    setLoading(true);
    const result = await createFolder({
      name: newFolderName,
      color: newFolderColor,
      parent_id: parentFolderForNew?.id || null,
    });
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (parentFolderForNew) {
      setExpandedIds((prev) => new Set(prev).add(parentFolderForNew.id));
    }

    toast.success(parentFolderForNew ? "Subfolder created" : "Folder created");
    setNewFolderName("");
    setNewFolderColor("#6366f1");
    setParentFolderForNew(null);
    setIsCreateOpen(false);
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) {
      toast.error("Folder name is required");
      return;
    }

    setLoading(true);
    const result = await updateFolder(editingFolder.id, { name: newFolderName, color: newFolderColor });
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Folder updated");
    setEditingFolder(null);
    setNewFolderName("");
    setNewFolderColor("#6366f1");
    setIsEditOpen(false);
  };

  const handleDeleteFolder = async () => {
    if (!editingFolder) return;

    setLoading(true);
    const result = await deleteFolder(editingFolder.id);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Folder deleted");
    if (selectedFolderId === editingFolder.id) {
      onSelectFolder(null);
    }
    setEditingFolder(null);
    setIsDeleteOpen(false);
  };

  const openEditDialog = (folder: FolderType) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderColor(folder.color || "#6366f1");
    setIsEditOpen(true);
  };

  const openDeleteDialog = (folder: FolderType) => {
    setEditingFolder(folder);
    setIsDeleteOpen(true);
  };

  const ColorPicker = ({ value, onChange }: { value: string; onChange: (c: string) => void }) => (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => (
        <button
          key={color}
          className={cn(
            "h-6 w-6 rounded-full transition-transform",
            value === color && "ring-2 ring-offset-2 ring-primary scale-110"
          )}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      <div className={cn("p-4 border-b flex items-center", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && <h2 className="font-semibold text-lg">Folders</h2>}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {collapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectFolder(null)}
                    className={cn(
                      "w-full flex items-center justify-center p-2 rounded-md transition-colors",
                      selectedFolderId === null
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <Folder className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">All Prompts</TooltipContent>
              </Tooltip>

              {folders.map((folder) => (
                <Tooltip key={folder.id}>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        "w-full flex items-center justify-center p-2 rounded-md transition-colors",
                        selectedFolderId === folder.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                      onClick={() => onSelectFolder(folder.id)}
                    >
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: folder.color || "#6366f1" }}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{folder.name}</TooltipContent>
                </Tooltip>
              ))}
            </>
          ) : (
            <>
              <button
                onClick={() => onSelectFolder(null)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  selectedFolderId === null
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted"
                )}
              >
                <Folder className="h-4 w-4" />
                <span>All Prompts</span>
              </button>

              {tree.map((node) => (
                <FolderNode
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={onSelectFolder}
                  onAddSubfolder={(parent) => openCreateDialog(parent)}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="w-full" onClick={() => openCreateDialog(null)}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New Folder</TooltipContent>
          </Tooltip>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => openCreateDialog(null)}>
            <Plus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        )}
      </div>

      {/* Create / Subfolder Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {parentFolderForNew ? `New Subfolder in "${parentFolderForNew.name}"` : "Create Folder"}
            </DialogTitle>
            <DialogDescription>
              {parentFolderForNew
                ? "Add a subfolder to help further organize your prompts."
                : "Add a new folder to organize your prompts."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Name</Label>
              <Input
                id="folder-name"
                placeholder={parentFolderForNew ? "Subfolder name" : "My Prompts"}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <ColorPicker value={newFolderColor} onChange={setNewFolderColor} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>Update the folder name and color.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">Name</Label>
              <Input
                id="edit-folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdateFolder()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <ColorPicker value={newFolderColor} onChange={setNewFolderColor} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFolder} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{editingFolder?.name}&quot; and all its subfolders and prompts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
