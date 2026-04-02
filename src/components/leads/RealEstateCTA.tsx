"use client";

import { useState } from "react";
import Image from "next/image";

interface RealEstateCTAProps {
  neighbourhoodName?: string;
}

export default function RealEstateCTA({ neighbourhoodName }: RealEstateCTAProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/real-estate-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          neighbourhood: neighbourhoodName,
          interest: form.interest,
        }),
      });

      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", phone: "", interest: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="mt-4 bg-white rounded-lg border border-gray-200 py-12 px-4 sm:px-8 text-center">
        <div className="text-3xl mb-3">&#10003;</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Message Sent!</h3>
        <p className="text-gray-500 text-sm">
          Sabrina will get back to you shortly{neighbourhoodName ? ` about ${neighbourhoodName}` : ""}.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-white rounded-lg border border-gray-200 py-8 sm:py-10 px-4 sm:px-8">
      {/* Agent Profile */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 border-2 border-rose-100">
          <Image
            src="/sabrina-profile-cropped.png"
            alt="Sabrina - Real Estate Agent"
            width={96}
            height={96}
            className="object-cover w-full h-full"
          />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          Looking to Buy or Sell Your Home{neighbourhoodName ? ` in ${neighbourhoodName}` : " in Ottawa"}?
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Get in touch with Sabrina, a local real estate agent, for a free consultation.
        </p>
      </div>

      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="space-y-3 max-w-md mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Your Name *"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 caret-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
          <input
            type="email"
            placeholder="Email *"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 caret-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 caret-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
          <select
            value={form.interest}
            onChange={(e) => setForm({ ...form, interest: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-gray-500"
            style={form.interest ? { color: "#111827" } : {}}
          >
            <option value="">I&apos;m looking to...</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="both">Buy &amp; Sell</option>
            <option value="invest">Invest</option>
          </select>
        </div>

        <textarea
          placeholder="Tell Sabrina a bit about what you're looking for..."
          rows={3}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 caret-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
        />

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full bg-rose-500 text-white font-medium py-3 rounded-full hover:bg-rose-600 transition text-sm sm:text-base disabled:opacity-60"
        >
          {status === "sending" ? "Sending..." : "Send Message"}
        </button>

        {status === "error" && (
          <p className="text-red-500 text-xs text-center">
            Something went wrong. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}
