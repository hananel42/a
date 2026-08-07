/**
 * @file useConnectionCheck.ts
 * @description Periodic and manual connectivity verification service for OpenAI-compatible
 * endpoints (local or cloud). Tests reachability of the base URL using low-overhead fetches.
 *
 * API Outputs:
 * - status: 'checking' | 'connected' | 'offline'
 * - checkConnection: () => Promise<void>
 * - errorMessage: string | null
 */

import { useState, useEffect, useCallback } from "react";

export function useConnectionCheck(apiBaseUrl: string, apiKey: string) {
  const [status, setStatus] = useState<"checking" | "connected" | "offline">(
    "checking",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);

  const checkConnection = useCallback(async () => {
    if (!apiBaseUrl) {
      setStatus("offline");
      setErrorMessage("API Base URL is blank.");
      setModels([]);
      return;
    }

    setStatus("checking");
    setErrorMessage(null);

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (apiKey && apiKey.trim() !== "") {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3500);

      const cleanUrl = apiBaseUrl.endsWith("/")
        ? apiBaseUrl.slice(0, -1)
        : apiBaseUrl;
      const targetUrl = `${cleanUrl}/models`;

      const response = await fetch(targetUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(id);

      if (response.ok) {
        const data = await response.json();
        let fetchedList: string[] = [];
        if (data && Array.isArray(data.data)) {
          fetchedList = data.data
            .map((m: any) => m.id)
            .filter((id: any) => typeof id === "string");
        } else if (data && Array.isArray(data)) {
          fetchedList = data
            .map((m: any) => m.id || m)
            .filter((id: any) => typeof id === "string");
        }
        setModels(fetchedList);
        setStatus("connected");
        setErrorMessage(null);
      } else {
        let errDetail = `HTTP ${response.status}: ${response.statusText || "Endpoint Error"}`;
        try {
          const errBody = await response.json();
          if (errBody?.error?.message) {
            errDetail += ` (${errBody.error.message})`;
          }
        } catch {}
        setStatus("offline");
        setErrorMessage(errDetail);
        setModels([]);
      }
    } catch (err: any) {
      setStatus("offline");
      setModels([]);
      if (err.name === "AbortError") {
        setErrorMessage("Connection request timed out (no response within 3.5s).");
      } else {
        setErrorMessage(
          err.message || "Failed to connect to API endpoint. Check server or CORS.",
        );
      }
    }
  }, [apiBaseUrl, apiKey]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    status,
    errorMessage,
    checkConnection,
    models,
  };
}
