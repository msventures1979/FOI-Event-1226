"use server";

import { redirect } from "next/navigation";
import { unsubscribe } from "@/lib/unsubscribe";

export async function abmelden(form: FormData) {
  const token = String(form.get("token") ?? "");
  await unsubscribe(token);
  redirect(`/abmelden/${encodeURIComponent(token)}?ok=1`);
}
