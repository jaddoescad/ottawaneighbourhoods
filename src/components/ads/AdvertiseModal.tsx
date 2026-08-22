"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const BUDGETS = [
  "Not sure yet",
  "Under $100 / month",
  "$100 - $300 / month",
  "$300 - $1,000 / month",
  "$1,000+ / month",
];

const FIELD =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400";

export default function AdvertiseModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    business: "",
    name: "",
    email: "",
    website: "",
    budget: BUDGETS[0],
    message: "",
    company: "", // honeypot
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/advertise-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, page: window.location.pathname }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  // Portalled to <body>: the strip's marquee animation puts a transform on
  // an ancestor, which would otherwise turn `fixed` into "fixed inside the
  // moving strip" and hide the dialog.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-gray-900/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Advertise on OttawaHoods"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {status === "sent" ? (
          <div className="py-8 text-center">
            <div className="mb-3 text-3xl">&#10003;</div>
            <h3 className="text-lg font-semibold text-gray-900">
              Thanks - enquiry sent
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              We&apos;ll get back to you with rates and available slots.
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Advertise on OttawaHoods
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Reach Ottawa renters and home buyers comparing neighbourhoods.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 -mt-1 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <input
                required
                value={form.business}
                onChange={set("business")}
                placeholder="Business name *"
                className={FIELD}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Your name"
                  className={FIELD}
                />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="Email *"
                  className={FIELD}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  value={form.website}
                  onChange={set("website")}
                  placeholder="Website"
                  className={FIELD}
                />
                <select
                  value={form.budget}
                  onChange={set("budget")}
                  className={FIELD}
                >
                  {BUDGETS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={form.message}
                onChange={set("message")}
                rows={3}
                placeholder="What are you looking to promote?"
                className={FIELD}
              />

              {/* honeypot - hidden from people, tempting to bots */}
              <input
                value={form.company}
                onChange={set("company")}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />

              {status === "error" && (
                <p className="text-sm text-rose-600">
                  Something went wrong. Try again, or email us instead.
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-full bg-rose-500 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
              >
                {status === "sending" ? "Sending..." : "Send enquiry"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
