"use client";

import { useCallback, useEffect, useState } from "react";
import type { LiveModelCatalog, LiveModelOption } from "@/types";

interface UseLiveModelsResult {
  textModels: LiveModelOption[];
  imageModels: LiveModelOption[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLiveModels(autoLoad = true): UseLiveModelsResult {
  const [textModels, setTextModels] = useState<LiveModelOption[]>([]);
  const [imageModels, setImageModels] = useState<LiveModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async (refresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = refresh ? "/api/models?refresh=true" : "/api/models";
      const response = await fetch(url, { cache: "no-store" });
      const data = (await response.json()) as LiveModelCatalog & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load models.");
      }

      setTextModels(data.textModels ?? []);
      setImageModels(data.imageModels ?? []);
    } catch (loadError) {
      setTextModels([]);
      setImageModels([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load models.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadModels(true);
  }, [loadModels]);

  useEffect(() => {
    if (autoLoad) {
      void loadModels(false);
    }
  }, [autoLoad, loadModels]);

  return {
    textModels,
    imageModels,
    isLoading,
    error,
    refresh,
  };
}
