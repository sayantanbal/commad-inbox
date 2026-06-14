"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AI_PROVIDER_STORAGE_KEY,
  DEFAULT_AI_PROVIDER,
  isAiProvider,
  type AiProvider,
} from "@/lib/ai/providers";
import { fetchAiKeysApi, type AiKeysStatus } from "@/lib/inbox/client-api";
import { requestReembed } from "@/lib/embeddings/request-reembed";

export function useAiProvider() {
  const [provider, setProviderState] = useState<AiProvider>(DEFAULT_AI_PROVIDER);
  const [ready, setReady] = useState(false);
  const [aiKeysStatus, setAiKeysStatus] = useState<AiKeysStatus | null>(null);
  const providerRef = useRef(provider);

  const refreshAiKeysStatus = useCallback(async () => {
    try {
      const status = await fetchAiKeysApi();
      setAiKeysStatus(status);
      if (status.available.length > 0 && !status.available.includes(providerRef.current)) {
        const next = status.available[0] ?? DEFAULT_AI_PROVIDER;
        providerRef.current = next;
        setProviderState(next);
        localStorage.setItem(AI_PROVIDER_STORAGE_KEY, next);
      }
      return status;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(AI_PROVIDER_STORAGE_KEY);
    if (stored && isAiProvider(stored)) {
      setProviderState(stored);
      providerRef.current = stored;
    }

    void refreshAiKeysStatus().finally(() => setReady(true));
  }, [refreshAiKeysStatus]);

  useEffect(() => {
    if (!ready) return;
    void requestReembed(providerRef.current).catch(() => undefined);
  }, [ready]);

  const setProvider = useCallback((next: AiProvider) => {
    const previous = providerRef.current;
    if (previous === next) return;

    providerRef.current = next;
    setProviderState(next);
    localStorage.setItem(AI_PROVIDER_STORAGE_KEY, next);

    void requestReembed(next).catch((error) => {
      console.warn("[reembed] request failed:", error);
    });
  }, []);

  const availableProviders = aiKeysStatus?.available ?? [];

  return {
    provider,
    setProvider,
    ready,
    aiKeysStatus,
    setAiKeysStatus,
    refreshAiKeysStatus,
    availableProviders,
  };
}
