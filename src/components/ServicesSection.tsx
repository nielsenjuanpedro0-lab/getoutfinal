import { Cake, Users, CalendarDays } from "lucide-react";

const services = [
  {
    icon: Cake,
    title: "Cumpleaños",
    description: "Festejá tu cumple de una forma diferente. Organizamos tu evento con todo incluido para que la pases increíble con tus amigos.",
  },
  {
    icon: Users,
    title: "Team Building",
    description: "Fortalecé los lazos de tu equipo de trabajo con una experiencia desafiante, divertida y colaborativa.",
  },
  {
    icon: CalendarDays,
    title: "Turnos Exclusivos",
    description: "Durante la semana tenemos turnos exclusivos para tu grupo. Consultá disponibilidad y armá tu experiencia a medida.",
  },
];

export default function ServicesSection() {
  return (
    <section className="py-24 md:py-32 bg-muted/20">
      <div className="container">
        <h2 className="reveal font-display text-5xl md:text-7xl text-center text-foreground mb-16">
          Experiencias Especiales
        </h2>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, i) => (
            <div
              key={service.title}
              className={`reveal reveal-delay-${i + 1} text-center p-8 rounded-lg border border-border bg-card hover:border-primary/40 transition-all duration-300`}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <service.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-3xl text-foreground mb-3">{service.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {service.description}
              </p>
              <a
                href="https://wa.me/5492262000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-primary text-primary-foreground font-bold text-sm px-6 py-3 rounded-md hover:brightness-110 active:scale-[0.97] transition-all duration-200"
              >
                CONSULTAR POR WHATSAPP
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
