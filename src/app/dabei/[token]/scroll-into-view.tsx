"use client";

import { useEffect } from "react";

/** Nach dem Absenden die Danke-Box sicher ins Bild holen (Formular-Redirect behält sonst die Scrollposition). */
export function ScrollIntoView({ id }: { id: string }) {
  useEffect(() => {
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [id]);
  return null;
}
