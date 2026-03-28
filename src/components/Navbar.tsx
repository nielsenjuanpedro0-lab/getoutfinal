import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo-getout.png";

const links = [
  { label: "Inicio", href: "#inicio" },
  { label: "Salas", href: "#salas" },
  { label: "¿Cómo funciona?", href: "#como-funciona" },
  { label: "Reservar", href: "#reservar" },
  { label: "Contacto", href: "#reservar" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container flex items-center justify-between">
        <a href="#inicio" className="flex items-center group">
          <img src={logo} alt="GetOut!" className="h-12 object-contain" />
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#reservar"
            className="bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-md hover:brightness-110 active:scale-[0.97] transition-all duration-200"
          >
            ¡RESERVAR AHORA!
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-foreground"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border mt-2 py-4">
          <div className="container flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#reservar"
              onClick={() => setOpen(false)}
              className="bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-md text-center"
            >
              ¡RESERVAR AHORA!
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
