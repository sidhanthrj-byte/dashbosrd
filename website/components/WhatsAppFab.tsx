import { MessageCircle } from "lucide-react";
import { site } from "@/lib/data";

export function WhatsAppFab() {
  return (
    <a
      href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
        "Hi PONGS India — I'd like to know more about DESCOR® textile ceilings."
      )}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with PONGS India on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-xl shadow-ink/25 transition-transform hover:scale-105"
    >
      <MessageCircle size={24} />
    </a>
  );
}
