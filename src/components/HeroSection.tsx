import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import logo from "@/assets/logo-getout.png";
import heroCopan from "@/assets/hero-copan.jpg";
import heroInculpados from "@/assets/hero-inculpados.jpg";
import heroRefugio from "@/assets/hero-refugio.jpg";
import heroBirthday from "@/assets/hero-birthday.jpg";

const slides = [
  {
    image: heroCopan,
    title: "RUINAS DE COPÁN",
    subtitle: "Puesto N°3 en el Ranking Provincial",
    color: "#f0a500",
    position: "center 40%", // Higher percentage moves the image subjects UP (showing more bottom)
    centerText: true
  },
  {
    image: heroInculpados,
    title: "INCULPADOS",
    subtitle: "Puesto N°2 en el Ranking Provincial",
    color: "#4A90D9",
    position: "center 70%",
    centerText: true
  },
  {
    image: heroRefugio,
    title: "EL REFUGIO",
    subtitle: "Puesto N°4 en el Ranking Provincial",
    color: "#27AE60",
    centerText: true
  },
  {
    image: heroBirthday,
    title: "¡FESTEJÁ TU CUMPLE!",
    subtitle: "Una experiencia diferente para tu evento",
    color: "#E67E22",
    centerText: true // Special flag for birthday slide
  }
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  
  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section
      id="inicio"
      className="relative min-h-[100dvh] flex flex-col items-center justify-between overflow-hidden bg-black"
    >
      {/* Carousel Backgrounds */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className={`absolute inset-0 w-full h-full object-cover transform transition-transform duration-[6000ms] ease-linear ${
              index === current ? "scale-110" : "scale-100"
            }`}
            style={{ 
              filter: "brightness(0.5) contrast(1.1) saturate(1.1)", 
              transform: 'translate3d(0, 0, 0)',
              objectPosition: slide.position || 'center'
            }}
            loading="eager"
          />
          {/* Vignette & Gradients for Each Slide */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_50%,rgba(0,0,0,0.8)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>
      ))}

      {/* Persistent Fog & Noise Layers */}
      <div 
        className="absolute inset-0 fog-layer bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none mix-blend-overlay opacity-50" 
        style={{ transform: 'translate3d(0, 0, 0)', willChange: 'transform' }}
      />
      
      {/* Content Overhead */}
      <div className="w-full h-16 sm:h-24 pointer-events-none" />
      
      <div className={`relative z-10 w-full px-4 max-w-7xl mx-auto flex flex-col justify-center my-auto py-12 transition-all duration-700 ${slides[current].centerText ? 'items-center text-center' : 'items-start text-left'}`}>
        {/* Logo */}
        <div className={`reveal mb-6 md:mb-8 transition-all duration-700 transform hover:scale-105 ${slides[current].centerText ? 'mx-auto' : ''}`}>
          <img
            src={logo}
            alt="GetOut!"
            className="w-14 h-14 md:w-20 md:h-20 object-contain drop-shadow-[0_0_20px_rgba(230,126,34,0.4)]"
          />
        </div>

        {/* Dynamic Slide Content */}
        <div className={`min-h-[140px] md:min-h-[180px] flex flex-col ${slides[current].centerText ? 'items-center justify-center' : 'items-start justify-center'}`}>
          <div 
            key={`badge-${current}`}
            className="reveal inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-4 animate-fade-in-down"
          >
            <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            <p className="font-body text-primary text-[10px] md:text-xs font-black tracking-widest uppercase">
              {slides[current].subtitle}
            </p>
          </div>
          
          <h1 
            key={`title-${current}`}
            className={`reveal font-display text-4xl sm:text-6xl md:text-8xl leading-[1.1] text-white mb-6 drop-shadow-2xl font-bold tracking-tight animate-fade-in-up max-w-4xl ${slides[current].centerText ? 'mx-auto' : ''}`}
          >
            {slides[current].title.split(" ").map((word, i) => (
              <span key={i} className={`inline-block mr-3 ${i === slides[current].title.split(" ").length - 1 ? 'text-primary' : ''}`} style={i === slides[current].title.split(" ").length - 1 ? { textShadow: "0 0 30px rgba(230,126,34,0.4)" } : {}}>
                {word}
              </span>
            ))}
          </h1>
        </div>
        
        <div className={`reveal flex flex-col sm:flex-row gap-6 w-full sm:w-auto mt-4 ${slides[current].centerText ? 'justify-center items-center' : ''}`}>
          <a
            href="#salas"
            className="group active-tap relative overflow-hidden w-full sm:w-auto bg-primary text-primary-foreground font-bold px-10 py-5 rounded-xl text-base transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_40px_rgba(230,126,34,0.6)]"
          >
            <span className="relative z-10 tracking-widest uppercase font-black">
              RESERVAR AHORA
            </span>
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </a>
        </div>
      </div>

      {/* Navigation Indicators */}
      <div className="absolute bottom-24 left-0 right-0 z-20 flex justify-center gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-500 rounded-full h-1.5 ${
              i === current ? "w-10 bg-primary" : "w-3 bg-white/20 hover:bg-white/40"
            }`}
            aria-label={`Ir a slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Bouncing Scroll Indicator */}
      <div className="relative z-10 w-full flex justify-center pb-8 mt-auto pt-6">
        <div className="animate-bounce">
          <a href="#salas" className="text-white/50 hover:text-white transition-colors flex flex-col items-center gap-2">
            <span className="text-xs tracking-widest uppercase font-semibold">Descubrir salas</span>
            <ChevronDown className="w-6 h-6" />
          </a>
        </div>
      </div>
      
      {/* Side Arrows (Desktop) */}
      <button 
        onClick={prev}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-black/40 transition-all"
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        onClick={next}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-black/40 transition-all"
      >
        <ChevronRight size={24} />
      </button>
    </section>
  );
}
