import { MapPin, Instagram, MessageCircle, ExternalLink } from "lucide-react";

const ADDRESS = "Calle 83 N°345, Necochea, Buenos Aires";
const ADDRESS_MAPS_SEARCH = "Calle 83 345 Necochea Buenos Aires Argentina";
const MAPS_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(ADDRESS_MAPS_SEARCH)}&output=embed`;
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_MAPS_SEARCH)}`;

const contacts = [
  {
    id: "whatsapp",
    icon: MessageCircle,
    color: "#25D366",
    label: "WhatsApp",
    value: "+54 9 2262 314212",
    href: "https://wa.me/5492262314212?text=Hola!%20Quiero%20hacer%20una%20consulta",
  },
  {
    id: "instagram",
    icon: Instagram,
    color: "#E1306C",
    label: "Instagram",
    value: "@getout_salasdeescape",
    href: "https://instagram.com/getout_salasdeescape",
  },
  {
    id: "location",
    icon: MapPin,
    color: "#E67E22",
    label: "Dirección",
    value: ADDRESS,
    href: MAPS_LINK,
  },
];

export default function ContactInfoSection() {
  return (
    <section id="contacto" className="py-24 md:py-32 bg-muted/20">
      <div className="container">
        <h2 className="reveal font-display text-5xl md:text-7xl text-center text-foreground mb-4">
          Contacto
        </h2>
        <p className="reveal text-center text-muted-foreground mb-16 text-lg">
          Estamos en Necochea. ¡Descubrinos!
        </p>

        <div className="grid lg:grid-cols-2 gap-10 items-start max-w-6xl mx-auto">
          
          {/* Contact cards */}
          <div className="space-y-5">
            {contacts.map((c, i) => (
              <a
                key={c.id}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`reveal reveal-delay-${i + 1} group flex items-center gap-5 p-6 rounded-2xl border border-border bg-card hover:bg-card/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                style={{ '--hover-color': c.color } as any}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${c.color}60`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${c.color}15`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${c.color}15`, border: `1px solid ${c.color}30` }}
                >
                  <c.icon className="w-6 h-6" style={{ color: c.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">{c.label}</p>
                  <p className="text-foreground font-medium truncate">{c.value}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>

          {/* Google Maps embed */}
          <div className="reveal reveal-delay-2 rounded-2xl overflow-hidden border border-border shadow-xl h-[360px] relative group">
            <iframe
              title="Ubicación GetOut!"
              src={MAPS_EMBED_URL}
              width="100%"
              height="100%"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0 grayscale group-hover:grayscale-0 transition-all duration-500"
            />
            {/* Clickable overlay to open in Maps */}
            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold px-3 py-2 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-lg"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir en Maps
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
