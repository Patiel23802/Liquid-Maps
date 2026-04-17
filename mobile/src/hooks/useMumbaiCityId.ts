import { useEffect, useState } from "react";
import { api } from "../api/client";

/** MVP: default launch city Mumbai */
export function useMumbaiCityId(
  userCityId: string | null | undefined
): string | null {
  const [fallback, setFallback] = useState<string | null>(null);

  useEffect(() => {
    if (userCityId) return;
    let cancelled = false;
    (async () => {
      try {
        const cities = await api<
          { id: string; slug: string; name: string }[]
        >("/cities", { auth: false });
        const m = cities.find((c) => c.slug === "mumbai") ?? cities[0];
        if (!cancelled && m) setFallback(m.id);
      } catch {
        /* offline */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userCityId]);

  return userCityId ?? fallback;
}
