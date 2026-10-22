import "server-only";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Umgebungsvariable ${name} fehlt`);
  return v;
}

export const env = {
  get supabaseUrl() {
    return req("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseServiceKey() {
    return req("SUPABASE_SERVICE_ROLE_KEY");
  },
  get resendKey() {
    return req("RESEND_API_KEY");
  },
  get mailFrom() {
    return process.env.MAIL_FROM ?? "Frontline of Innovation <racing@frontlineofinnovation.de>";
  },
  get mailReplyTo() {
    return process.env.MAIL_REPLY_TO ?? "info@frontlineofinnovation.de";
  },
  get mailDailyLimit() {
    return Number(process.env.MAIL_DAILY_LIMIT ?? "100");
  },
  get siteUrl() {
    return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get eventSlug() {
    return process.env.EVENT_SLUG ?? "racing-2026";
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
  get adminEmails() {
    return (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  },
  get hasDb() {
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
};
