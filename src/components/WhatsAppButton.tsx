import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5492262000000"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[hsl(142,70%,40%)] flex items-center justify-center shadow-lg shadow-[hsl(142,70%,40%)]/30 hover:scale-110 active:scale-95 transition-transform duration-200"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-foreground" />
    </a>
  );
}
