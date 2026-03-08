import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header Skeleton */}
      <header className="h-14 border-b px-4 flex items-center justify-between bg-background">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white dark:text-zinc-900" />
          </div>
          <span className="text-xl font-bold">Promptbank</span>
        </div>
        <Skeleton className="h-8 w-32" />
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="w-64 border-r p-4 space-y-4 hidden lg:block">
          <Skeleton className="h-6 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Prompt List Skeleton */}
        <div className="w-80 border-r p-4 space-y-4 hidden sm:block">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>

        {/* Editor Skeleton */}
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
