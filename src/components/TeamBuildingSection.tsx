import { Users, Target, Handshake, Briefcase, Layers } from "lucide-react";

export default function TeamBuildingSection() {
  return (
    <section className="relative py-20 md:py-32 lg:py-48 bg-[#14100c] overflow-hidden">
      
      {/* Elegant Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-orange-500/10 blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-0 left-[-20%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px] mix-blend-screen" />
      </div>

      {/* Massive Decor Text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none opacity-[0.02] select-none flex flex-col justify-center overflow-hidden">
        <span className="font-display text-[7rem] sm:text-[10rem] md:text-[16rem] lg:text-[25rem] leading-none whitespace-nowrap font-black text-white">CORPORATE</span>
      </div>

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-8 items-center">
          
          {/* Left Side: Typography & CTA */}
          <div className="lg:col-span-5 reveal flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400 font-medium text-xs sm:text-sm tracking-widest uppercase mb-6 sm:mb-8 shadow-[0_0_20px_rgba(249,115,22,0.15)]">
              <Briefcase className="w-4 h-4" /> Para empresas y equipos
            </div>
            
            <h2 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[0.9] tracking-tight mb-6 md:mb-8">
              TEAM <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-600 drop-shadow-lg">
                BUILDING
              </span>
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl text-zinc-400 leading-relaxed font-light max-w-lg mx-auto lg:mx-0 mb-10 md:mb-12">
              Fortalecé los lazos de tu equipo de trabajo con una experiencia{" "}
              <b className="text-white font-medium">desafiante, divertida y colaborativa</b>{" "}
              que jamás olvidarán.
            </p>

            <a
              href="https://wa.me/5492262000000?text=Hola!%20Represento%20a%20una%20empresa%20y%20quiero%20consultar%20por%20sus%20eventos%20de%20Team%20Building."
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-lg px-8 py-5 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-[0_10px_40px_-10px_rgba(249,115,22,0.8)] active:scale-95 w-full sm:w-auto overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Users className="w-5 h-5" />
                CONSULTAR PARA MI EQUIPO
              </span>
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </a>
          </div>

          {/* Right Side: Elegant Floating Cards */}
          <div className="lg:col-span-7 relative h-full w-full">
            <div className="grid gap-6 sm:grid-cols-2 relative lg:-right-8">
              
              {/* Card 1 */}
              <div className="reveal reveal-delay-1 sm:mt-12 group p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl transition-all duration-500 hover:bg-white/10 hover:border-orange-500/50 hover:-translate-y-2 text-center sm:text-left shadow-lg">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto sm:mx-0 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 flex items-center justify-center mb-4 sm:mb-6 text-orange-400 group-hover:scale-110 group-hover:text-orange-300 transition-all duration-500 shadow-inner">
                  <Target className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="font-display text-2xl sm:text-3xl text-white mb-2 sm:mb-3">Desafío en Equipo</h3>
                <p className="text-zinc-400 leading-relaxed text-sm md:text-base font-light">
                  Pongan a prueba la comunicación y el liderazgo bajo presión real para lograr escapar a tiempo.
                </p>
              </div>

              {/* Card 2 */}
              <div className="reveal reveal-delay-2 group p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl transition-all duration-500 hover:bg-white/10 hover:border-amber-500/50 hover:-translate-y-2 text-center sm:text-left shadow-lg">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto sm:mx-0 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex items-center justify-center mb-4 sm:mb-6 text-amber-400 group-hover:scale-110 group-hover:text-amber-300 transition-all duration-500 shadow-inner">
                  <Handshake className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="font-display text-2xl sm:text-3xl text-white mb-2 sm:mb-3">Lazos más Fuertes</h3>
                <p className="text-zinc-400 leading-relaxed text-sm md:text-base font-light">
                  Una experiencia compartida tan intensa que genera conexiones reales y duraderas entre los participantes.
                </p>
              </div>

              {/* Card 3 */}
              <div className="reveal reveal-delay-3 sm:col-span-2 lg:w-[80%] lg:mx-auto group p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl transition-all duration-500 hover:bg-white/10 hover:border-yellow-500/50 hover:-translate-y-2 text-center sm:text-left shadow-lg">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto sm:mx-0 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/20 flex items-center justify-center text-yellow-400 group-hover:scale-110 group-hover:text-yellow-300 transition-all duration-500 shadow-inner flex-shrink-0">
                    <Layers className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl sm:text-3xl text-white mb-2">Experiencia personalizable</h3>
                    <p className="text-zinc-400 leading-relaxed text-sm md:text-base font-light">
                      Adaptamos la experiencia según el tamaño de tu equipo.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
