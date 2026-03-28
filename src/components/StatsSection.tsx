import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 3, label: "Salas únicas" },
  { value: 60, label: "Minutos de adrenalina" },
  { value: 10, label: "Jugadores máximo" },
];

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 1500;
          const startTime = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            start = Math.floor(progress * target);
            setCount(start);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}</span>;
}

export default function StatsSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="reveal grid sm:grid-cols-3 gap-12 text-center mb-12">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-6xl md:text-8xl text-primary">
                <AnimatedCounter target={s.value} />
              </p>
              <p className="text-lg text-muted-foreground mt-2">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="reveal text-center text-muted-foreground text-lg italic max-w-xl mx-auto" style={{ textWrap: "balance" }}>
          "La experiencia de entretenimiento más original de Necochea"
        </p>
      </div>
    </section>
  );
}
