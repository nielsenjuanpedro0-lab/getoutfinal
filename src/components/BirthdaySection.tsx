import { Cake, PartyPopper, Star, Sparkles } from "lucide-react";

export default function BirthdaySection() {
  return (
    <section className="relative py-28 md:py-40 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute top-20 right-10 w-[200px] h-[200px] rounded-full bg-secondary/10 blur-[80px]" />
      </div>

      <div className="container relative">
        {/* Floating icons */}
        <div className="hidden md:block">
          <PartyPopper className="absolute -top-4 left-[15%] w-8 h-8 text-primary/30 rotate-[-15deg]" />
          <Sparkles className="absolute top-20 right-[10%] w-10 h-10 text-secondary/25 rotate-12" />
          <Star className="absolute bottom-10 left-[8%] w-6 h-6 text-primary/20" />
        </div>

        <div className="reveal text-center mb-12">
          <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase text-primary mb-4">
            <Cake className="w-4 h-4" />
            Experiencia única
          </span>
          <h2 className="font-display text-6xl md:text-8xl lg:text-9xl text-foreground leading-[0.9]">
            Cumpleaños
          </h2>
          <h3 className="font-display text-4xl md:text-5xl text-primary mt-2">
            Que No Se Olvidan
          </h3>
        </div>

        <div className="reveal reveal-delay-1 max-w-3xl mx-auto">
          <div className="relative rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm p-8 md:p-12">
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary/40 rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary/40 rounded-br-2xl" />

            <p className="text-lg md:text-xl text-foreground/90 leading-relaxed text-center mb-8">
              Festejá tu cumple de una forma{" "}
              <span className="text-primary font-semibold">completamente diferente</span>.
              Un espacio ideal para vivir una actividad única con tus amigos que van a recordar toda la vida.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              {[
                { icon: "🎉", title: "Evento privado", desc: "La sala es toda tuya y de tu grupo" },
                { icon: "🎂", title: "Un lugar original", desc: "Una actividad diferente para celebrar" },
                { icon: "🔐", title: "Una actividad única", desc: "Una experiencia que van a recordar siempre" },
              ].map((item) => (
                <div key={item.title} className="text-center space-y-2">
                  <span className="text-3xl">{item.icon}</span>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <a
                href="https://wa.me/5492262314212?text=Hola!%20Quiero%20consultar%20por%20un%20cumplea%C3%B1os"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-primary text-primary-foreground font-bold text-lg px-10 py-4 rounded-xl hover:brightness-110 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-primary/25"
              >
                <Cake className="w-5 h-5" />
                ¡QUIERO MI CUMPLE ACÁ!
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
