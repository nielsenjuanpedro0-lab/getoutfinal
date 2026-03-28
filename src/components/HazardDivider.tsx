export default function HazardDivider() {
  return (
    <div className="relative w-full h-32 overflow-hidden flex items-center justify-center bg-background pointer-events-none z-20">
      
      {/* Background shadow/grunge to blend sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-transparent" />

      {/* Strip 1: NO PASAR */}
      <div className="absolute top-1/2 -ml-[10%] w-[120%] h-12 bg-yellow-400 rotate-[-2deg] -translate-y-1/2 flex items-center overflow-hidden border-y-4 border-black/90 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-10">
        <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite] w-[200%]">
          {[...Array(20)].map((_, i) => (
            <span key={`1-${i}`} className="text-black font-display text-2xl tracking-[0.2em] font-black mx-8 opacity-90">
              PELIGRO • NO PASAR • PELIGRO • NO PASAR •
            </span>
          ))}
        </div>
      </div>

      {/* Strip 2: ZONA RESTRINGIDA */}
      <div className="absolute top-1/2 -ml-[10%] w-[120%] h-10 bg-yellow-500 rotate-[3deg] -translate-y-1/2 flex items-center overflow-hidden border-y-[3px] border-black/90 shadow-[0_10px_30px_rgba(0,0,0,0.8)] mix-blend-darken z-20">
        <div className="flex whitespace-nowrap animate-[marquee_15s_linear_infinite_reverse] w-[200%]">
          {[...Array(20)].map((_, i) => (
            <span key={`2-${i}`} className="text-black font-display text-xl tracking-[0.15em] font-black mx-6 opacity-80">
              ZONA RESTRINGIDA • ZONA RESTRINGIDA •
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
