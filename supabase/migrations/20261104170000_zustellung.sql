-- Zustellstatus je Mail (aus Resend abgerufen): zugestellt, unzustellbar, beschwerde, verzögert
alter table public.email_log add column if not exists delivery text not null default '';
alter table public.email_log add column if not exists delivery_checked_at timestamptz;
create index if not exists email_log_delivery_idx on public.email_log (delivery);
