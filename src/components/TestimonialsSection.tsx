import { Star, Instagram } from "lucide-react";

const testimonials = [
  { name: "Camila R.", text: "¡Increíble experiencia! El Refugio nos hizo gritar del susto. Volvemos seguro." },
  { name: "Tomás B.", text: "Fuimos con amigos a Ruinas de Copan y no paramos de reír. Súper recomendable." },
  { name: "Valentina M.", text: "Inculpados tiene unos puzzles geniales. Escapamos con solo 3 minutos de sobra." },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 md:py-32 bg-muted/30">
      <div className="container">
        <h2 className="reveal font-display text-5xl md:text-7xl text-center text-foreground mb-16">
          Lo que dicen nuestros jugadores
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`reveal reveal-delay-${i + 1} bg-card border border-border rounded-lg p-6 space-y-4`}
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={16} className="fill-secondary text-secondary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.text}"</p>
              <p className="text-sm font-semibold text-foreground">— {t.name}</p>
            </div>
          ))}
        </div>
        <div className="reveal text-center">
          <a
            href="https://instagram.com/getout_salasdeescape"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:brightness-110 transition-colors font-medium"
          >
            <Instagram size={20} />
            Seguinos en Instagram @getout_salasdeescape
          </a>
        </div>
      </div>
    </section>
  );
}
