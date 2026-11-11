import { useEffect, useState } from "react";

export function getRoute(): string {
  const raw = window.location.hash.replace(/^#/, "");
  return raw.startsWith("/") ? raw : raw ? `/${raw}` : "/";
}

export function navigate(path: string): void {
  window.location.hash = path;
}

export function useHashRoute(): string {
  const [route, setRoute] = useState<string>(getRoute());
  useEffect(() => {
    const handler = () => {
      setRoute(getRoute());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return route;
}
