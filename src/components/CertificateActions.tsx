"use client";

import Icon from "./Icon";

export default function CertificateActions() {
  return (
    <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_22px_rgba(109,74,255,.2)]"><Icon name="download" size={15} /> Print / save PDF</button>
  );
}
