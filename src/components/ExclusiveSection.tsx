import { CalendarDays, Clock, Users, Search } from "lucide-react";

export default function ExclusiveSection() {
  return (
    <section className="relative py-20 md:py-32 lg:py-48 bg-zinc-950 overflow-hidden">
      {/* Top and Bottom Visual Separators */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent shadow-[0_0_20px_rgba(230,126,34,0.5)]" />
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-background to-transparent" />
      
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-background to-transparent" />

      {/* Cinematic Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: 'radial-gradient(circle at right, #E67E22 0%, transparent 60%)' }} />

      <div className="container relative z-10 w-full max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
          
          {/* Left Side: Dramatic Typography */}
          <div className="flex-1 text-center lg:text-left reveal">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/10 text-accent font-bold tracking-widest text-xs uppercase mb-8 shadow-[0_0_15px_rgba(230,126,34,0.3)]">
              <CalendarDays className="w-4 h-4" /> De Lunes a Viernes
            </div>
            
            <h2 className="font-display text-5xl sm:text-6xl md:text-8xl text-white leading-[0.9]">
              Turnos
              <span className="block text-accent mt-2 drop-shadow-xl" style={{ textShadow: "0 0 40px rgba(230,126,34,0.5)" }}>
                Exclusivos
              </span>
            </h2>
            
            <p className="mt-6 md:mt-8 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0 font-light">
              Durante la semana tenemos turnos exclusivos para tu grupo.{" "}
              <span className="text-white font-medium">Para grupos a partir de 4 personas.</span>{" "}
              Consultá disponibilidad y armá tu experiencia completamente a medida.
            </p>
          </div>

          {/* Right Side: Features */}
          <div className="flex-1 w-full max-w-xl lg:max-w-none relative reveal reveal-delay-1 space-y-6">
            
            {[
              { 
                icon: Clock, 
                title: "Horarios flexibles", 
                desc: "Elegí el horario que mejor te quede, adaptamos la agenda a vos.",
                accent: "text-primary", border: "border-primary/20", bg: "bg-primary/5 hover:bg-primary/10"
              },
              { 
                icon: Users, 
                title: "Grupo privado", 
                desc: "Toda la sala para tu grupo, sin desconocidos. La experiencia completa.",
                accent: "text-accent", border: "border-accent/20", bg: "bg-accent/5 hover:bg-accent/10"
              },
              { 
                icon: Users, 
                title: "Mínimo de jugadores", 
                desc: "Los turnos exclusivos están disponibles a partir de 4 personas.",
                accent: "text-secondary", border: "border-secondary/20", bg: "bg-secondary/5 hover:bg-secondary/10"
              },
            ].map((item, idx) => (
              <div key={idx} className={`relative flex items-start gap-5 p-6 rounded-2xl border ${item.border} ${item.bg} backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] overflow-hidden group/card`}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                <div className={`w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 relative z-10`}>
                  <item.icon className={`w-6 h-6 ${item.accent}`} />
                </div>
                <div className="relative z-10">
                  <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-base text-zinc-400 leading-relaxed font-light">{item.desc}</p>
                </div>
              </div>
            ))}

            <div className="pt-6">
              <a
                href="https://wa.me/5492262000000?text=Hola!%20Quiero%20consultar%20por%20un%20turno%20exclusivo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full relative overflow-hidden group/btn flex items-center justify-center gap-3 bg-accent text-accent-foreground font-bold text-lg px-8 py-5 rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-[0_0_30px_rgba(230,126,34,0.4)] hover:shadow-[0_0_50px_rgba(230,126,34,0.6)]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" /> 
                  CONSULTAR DISPONIBILIDAD
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </a>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
