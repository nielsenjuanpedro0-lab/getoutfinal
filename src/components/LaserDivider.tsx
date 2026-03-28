export default function LaserDivider() {
  return (
    <div className="relative w-full h-32 overflow-hidden flex flex-col items-center justify-center bg-zinc-950 pointer-events-none z-20">
      
      {/* Deep Shadow Blending */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black to-black/20" />

      {/* Laser Beams */}
      <div className="absolute w-[110%] -left-[5%] h-[2px] bg-red-500 shadow-[0_0_20px_5px_rgba(255,0,0,0.8)] top-[40%] rotate-1 animate-[pulse_3s_infinite]" />
      
      <div className="absolute w-[110%] -left-[5%] h-[1px] bg-red-400 shadow-[0_0_15px_4px_rgba(255,0,0,0.7)] top-[60%] -rotate-2 animate-[pulse_4s_infinite_1s]" />
      
      <div className="absolute w-full left-0 h-[2px] bg-red-600 shadow-[0_0_25px_6px_rgba(255,0,0,0.9)] top-[80%] opacity-80 animate-[pulse_2s_infinite_0.5s]" />

      {/* Laser Particles / Dust glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,0,0.15)_0%,transparent_60%)] mix-blend-screen" />
      
      {/* Warning Text Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="flex gap-32">
          {Array(5).fill(0).map((_, i) => (
            <span key={i} className="text-red-500 font-display text-4xl tracking-widest font-black">SYSTEM SECURED</span>
          ))}
        </div>
      </div>
      
    </div>
  );
}
