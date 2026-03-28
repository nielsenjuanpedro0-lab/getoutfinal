import { ChevronDown, Skull } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export default function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative min-h-[100dvh] flex flex-col items-center justify-between overflow-hidden"
    >
      {/* Top Spacer for optical centering */}
      <div className="w-full h-16 sm:h-24 pointer-events-none" />
      {/* Background image with slow zoom animation */}
      <div className="absolute inset-0 overflow-hidden bg-black">
        <img
          src={heroBg}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-40 animate-[zoom-in_30s_ease-in-out_infinite_alternate]"
        />
      </div>

      {/* Intensive Fog layers */}
      <div className="absolute inset-0 fog-layer bg-gradient-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 fog-layer-reverse bg-gradient-to-l from-secondary/10 via-transparent to-primary/10 pointer-events-none mix-blend-overlay" />
      
      {/* Radial cinematic vignette & noise */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(0_0%_4%)_85%)] pointer-events-none" />
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center my-auto py-12">
        
        {/* Mysterious Icon */}
        <div className="reveal mb-6 animate-pulse">
          <Skull className="w-12 h-12 text-primary/80 drop-shadow-[0_0_15px_rgba(230,126,34,0.5)]" />
        </div>

        <h1 className="reveal reveal-delay-1 font-display text-7xl sm:text-8xl md:text-9xl leading-[0.85] text-white mb-6 drop-shadow-2xl font-bold tracking-tight">
          ¿PODÉS 
          <span className="block text-primary mt-2" style={{ textShadow: "0 0 40px rgba(230,126,34,0.6)" }}>ESCAPAR?</span>
        </h1>
        
        <p className="reveal reveal-delay-2 font-body text-lg sm:text-xl md:text-2xl text-zinc-300 font-light max-w-2xl mx-auto mb-12 drop-shadow-md" style={{ textWrap: "balance" }}>
          Una experiencia inmersiva que vas a recordar para siempre. Tu intuición y equipo serán tus únicas herramientas.
        </p>
        
        <div className="reveal reveal-delay-3 flex flex-col sm:flex-row gap-6 justify-center items-center w-full sm:w-auto">
          <a
            href="#salas"
            className="group relative overflow-hidden w-full sm:w-auto bg-primary text-primary-foreground font-bold px-10 py-5 rounded-xl text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(230,126,34,0.5)] active:scale-95"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 tracking-wide">
              VER SALAS
            </span>
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </a>
          
          <a
            href="#como-funciona"
            className="w-full sm:w-auto border border-white/20 text-white font-bold px-10 py-5 rounded-xl text-xl hover:border-white/60 hover:bg-white/5 transition-all duration-300 active:scale-95 tracking-wide"
          >
            ¿CÓMO FUNCIONA?
          </a>
        </div>
      </div>

      {/* Bouncing Scroll Indicator - No longer absolute so it won't overlap on short screens */}
      <div className="relative z-10 w-full flex justify-center pb-8 mt-auto pt-6">
        <div className="reveal reveal-delay-4 animate-bounce">
          <a href="#salas" className="text-white/50 hover:text-white transition-colors flex flex-col items-center gap-2">
            <span className="text-xs tracking-widest uppercase font-semibold">Descubrir</span>
            <ChevronDown className="w-6 h-6" />
          </a>
        </div>
      </div>
    </section>
  );
}
