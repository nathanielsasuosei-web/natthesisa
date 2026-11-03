"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/pass-periods";
import CheckoutModal from "./CheckoutModal";

interface Props {
  programId: string;
  programName: string;
  price: number;
  /** The paid deposit row whose balance is still due. */
  reference: string;
  amount: number;
  balanceDue: number;
}

/**
 * Pays the remaining balance of a half-now purchase. Opens the same secure
 * checkout as a normal payment, marked so the server knows which deposit it
 * clears — nothing is granted twice, and the debt comes off the books when
 * the money lands.
 */
export default function PayBalanceButton({
  programId,
  programName,
  price,
  reference,
  amount,
  balanceDue,
}: Props) {
  const router = useRouter();
  const [checkout, setCheckout] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setCheckout(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[#ded9e3] bg-white font-extrabold text-[#5e3de0] transition hover:bg-[#faf9fb] px-4 py-3 text-[10px]"
      >
        Pay GH₵{formatMoney(balanceDue)}
      </button>
      {checkout && (
        <CheckoutModal
          title={`Clear the ${programName} balance`}
          subtitle="Pays off your deposit — every course and lesson in the program is open once it lands."
          amount={balanceDue}
          fullAmount={price}
          deposit={false}
          settlesReference={reference}
          payload={{ kind: "program", programId, settlesReference: reference }}
          successMessage={`Balance paid — the ${programName} program is fully paid. Every course and lesson in it is open.`}
          onClose={() => setCheckout(false)}
          onSuccess={() => {
            setCheckout(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
