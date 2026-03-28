export default function SmokeDivider() {
  return (
    <div className="relative w-full h-16 md:h-24 lg:h-32 overflow-hidden bg-zinc-950 z-20">
      {/* Diagonal geometric slant bridging the two background colors */}
      <svg 
        className="absolute bottom-0 w-full h-full text-[#14100c]" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        <polygon fill="currentColor" points="0,100 100,0 100,100" />
      </svg>
      {/* Golden glow bleeding from the cut */}
      <div className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-t from-orange-500/10 to-transparent blur-2xl pointer-events-none" />
    </div>
  );
}
