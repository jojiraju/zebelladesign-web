import "server-only";

export interface EmailResult {
  sent: boolean;
  reason?: string;
}

/**
 * Transactional email via Resend's REST API. Credentials stay server-side.
 * Returns {sent:false} (and logs) when not configured — callers must not claim an email went out.
 */
export async function sendEmail(args: { to: string; subject: string; html: string }): Promise<EmailResult> {
  const key = process.env.EMAIL_PROVIDER_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS;
  if (!key || !from) {
    console.warn(`[email] not configured; skipped "${args.subject}"`);
    return { sent: false, reason: "not_configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: args.to, subject: args.subject, html: args.html }),
    });
    if (!res.ok) {
      console.error("[email] provider rejected message", res.status);
      return { sent: false, reason: `provider_${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] send failed", e);
    return { sent: false, reason: "network" };
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const shell = (title: string, body: string) =>
  `<div style="font-family:Georgia,serif;background:#FDF8F6;padding:32px;color:#231A1D"><div style="max-width:560px;margin:auto;background:#fff;padding:32px"><h1 style="font-weight:400;letter-spacing:.2em;font-size:18px">ZEBELLA DESIGNS</h1><h2 style="font-weight:400">${esc(title)}</h2>${body}</div></div>`;

export const orderConfirmationEmail = (orderId: string, total: string) => ({
  subject: `Your Zebella Designs order ${orderId} is confirmed`,
  html: shell("Thank you for your order", `<p>We have received your payment of <b>${esc(total)}</b> for order <b>${esc(orderId)}</b>. We will email you again when it ships.</p>`),
});

export const shippingEmail = (orderId: string, carrier: string, tracking: string) => ({
  subject: `Your order ${orderId} has shipped`,
  html: shell("Your order is on its way", `<p>Order <b>${esc(orderId)}</b> was shipped via ${esc(carrier)}. Tracking number: <b>${esc(tracking)}</b>.</p>`),
});
