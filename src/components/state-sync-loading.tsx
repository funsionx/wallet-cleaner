"use client";

import { useIsRestoring } from "@tanstack/react-query";

export function StateSyncLoading() {
  const isRestoring = useIsRestoring();
  if (!isRestoring) return null;
  return (
    <div className="fixed left-0 top-0 w-full text-center text-xs py-1 bg-black/60 text-white z-50">
      Restoring state...
    </div>
  );
}
