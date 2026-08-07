"use client";

import type { ReactNode } from "react";

/**
 * Sponsor link that pings /api/ad-click before handing off to the
 * advertiser. sendBeacon survives the navigation and never blocks it, so a
 * failed ping can't stop the click from going through.
 */
export default function AdClickLink({
  adId,
  href,
  className,
  children,
}: {
  adId: string;
  href: string;
  className: string;
  children: ReactNode;
}) {
  const track = () => {
    try {
      const payload = JSON.stringify({ adId, page: window.location.pathname });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/ad-click",
          new Blob([payload], { type: "application/json" }),
        );
      } else {
        fetch("/api/ad-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // tracking must never break the click
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={track}
      onAuxClick={track}
      className={className}
    >
      {children}
    </a>
  );
}
