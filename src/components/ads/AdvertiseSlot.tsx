"use client";

import { useState, type ReactNode } from "react";
import AdvertiseModal from "./AdvertiseModal";

/** Empty "Your ad here" slot - opens the advertising enquiry form. */
export default function AdvertiseSlot({
  className,
  tabIndex,
  children,
}: {
  className: string;
  tabIndex?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Advertise on OttawaHoods"
        aria-haspopup="dialog"
        tabIndex={tabIndex}
        className={className}
      >
        {children}
      </button>
      {open && <AdvertiseModal onClose={() => setOpen(false)} />}
    </>
  );
}
