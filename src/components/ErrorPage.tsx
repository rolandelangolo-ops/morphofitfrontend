import { useState } from "react";
import { Link, useNavigate, useRouteError, isRouteErrorResponse } from "react-router";
import { motion } from "framer-motion";
import { C, FONT } from "./ui/tokens";
import { AppIcon } from "./ui/icons";

function describeError(error: unknown): { title: string; status?: number; detail: string; stack?: string } {
  if (isRouteErrorResponse(error)) {
    return {
      title: error.status === 404 ? "That page doesn't exist" : "The atelier hit a snag",
      status: error.status,
      detail: error.statusText || (typeof error.data === "string" ? error.data : "The route failed to load."),
    };
  }
  if (error instanceof Error) {
    return { title: "A seam came undone", detail: error.message, stack: error.stack };
  }
  return { title: "A seam came undone", detail: typeof error === "string" ? error : "Something unexpected happened." };
}

/** Fancy, on-brand replacement for React Router's default "Unexpected
 * Application Error!" screen — set as `errorElement` on each top-level
 * route (see app/routes.ts) so any render/loader error anywhere in that
 * route's subtree lands here instead of the bare browser-default dump.
 * Deliberately self-contained (no dependency on AppShell/Sidebar/TopBar) —
 * an errorElement replaces its route's entire subtree, so a crash inside
 * /dashboard unmounts the shell along with the page that threw. */
export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const { title, status, detail, stack } = describeError(error);

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16"
      style={{ background: C.cream, fontFamily: FONT.sans }}
    >
      <div className="absolute inset-0" style={{ background: C.gradientMesh }} />
      <div
        className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: C.gradientAmber }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        className="relative w-full max-w-lg rounded-[28px] border p-8 text-center sm:p-10"
        style={{ background: C.white, borderColor: C.parchmentDark, boxShadow: C.shadowXl }}
      >
        <motion.div
          initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.2, 1.4, 0.4, 1], delay: 0.1 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: C.gradientPrimary, boxShadow: `0 12px 32px ${C.glowForest}` }}
        >
          <AppIcon name="alert" size={32} strokeWidth={1.6} style={{ color: "#fff" }} />
        </motion.div>

        <div style={{ fontFamily: FONT.mono, color: C.forest }} className="mb-3 text-[10px] uppercase tracking-[0.3em]">
          {status ? `Error ${status}` : "Unexpected Error"}
        </div>

        <h1 style={{ fontFamily: FONT.serif, color: C.ink }} className="mb-3 text-3xl font-bold leading-tight sm:text-4xl">
          {title}
        </h1>

        <p style={{ fontFamily: FONT.sans, color: C.inkMuted }} className="mx-auto mb-8 max-w-sm text-sm leading-relaxed">
          Something snagged on our end. Reloading usually smooths it right back out — if it keeps happening, head back to your dashboard and try again from there.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-full px-6 py-3 text-sm font-semibold transition-transform active:scale-95"
            style={{ background: C.forest, color: "#fff", fontFamily: FONT.sans, boxShadow: `0 8px 24px ${C.glowForest}` }}
          >
            Reload page
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-full border px-6 py-3 text-sm font-semibold transition-colors"
            style={{ borderColor: C.parchmentDark, color: C.ink, fontFamily: FONT.sans, background: C.white }}
          >
            Back to dashboard
          </button>
        </div>

        <Link to="/" style={{ fontFamily: FONT.mono, color: C.inkSubtle }} className="mt-6 block text-[10px] uppercase tracking-[0.2em] no-underline">
          Or return to the homepage
        </Link>

        <div className="mt-8 border-t pt-5" style={{ borderColor: C.parchmentDark }}>
          <button
            onClick={() => setShowDetails((s) => !s)}
            className="mx-auto flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em]"
            style={{ fontFamily: FONT.mono, color: C.inkSubtle }}
          >
            <AppIcon name={showDetails ? "chevronDown" : "chevronRight"} size={11} />
            Technical details
          </button>
          {showDetails && (
            <motion.pre
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 max-h-48 overflow-auto rounded-xl border p-3.5 text-left text-[10px] leading-relaxed"
              style={{ background: C.parchment, borderColor: C.parchmentDark, color: C.inkMuted, fontFamily: FONT.mono }}
            >
              {detail}
              {stack ? `\n\n${stack}` : ""}
            </motion.pre>
          )}
        </div>
      </motion.div>
    </div>
  );
}
