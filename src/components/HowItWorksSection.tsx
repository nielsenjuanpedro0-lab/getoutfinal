import { Search, CalendarDays, Users, Lock } from "lucide-react";

const steps = [
  { icon: Search, title: "Elegís tu sala", desc: "Tres experiencias únicas para todos los gustos" },
  { icon: CalendarDays, title: "Reservás tu turno", desc: "Online o por WhatsApp, rápido y fácil" },
  { icon: Users, title: "Venís con tu grupo", desc: "De 2 a 10 jugadores por sala" },
  { icon: Lock, title: "¡Intentás escapar!", desc: "60 minutos de adrenalina pura" },
];

export default function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 md:py-32 bg-muted/30">
      <div className="container">
        <h2 className="reveal font-display text-5xl md:text-7xl text-center text-foreground mb-16">
          ¿Cómo funciona?
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.title} className={`reveal reveal-delay-${i + 1} text-center space-y-4`}>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-2xl text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
