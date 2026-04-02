import { Instagram } from "lucide-react";
import logo from "@/assets/logo-footer.png";

export default function Footer() {
  return (
    <footer className="border-t border-border py-12 bg-muted/20">
      <div className="container text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <img src={logo} alt="GetOut!" className="h-14 w-auto rounded-lg object-contain" />
        </div>
        <p className="text-sm text-muted-foreground">
          Una experiencia que vas a recordar toda la vida 🔓
        </p>
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <a href="#inicio" className="hover:text-foreground transition-colors">Inicio</a>
          <a href="#salas" className="hover:text-foreground transition-colors">Salas</a>
          <a href="#eventos-especiales" className="hover:text-foreground transition-colors">Eventos especiales</a>
          <a href="#contacto" className="hover:text-foreground transition-colors">Contacto</a>
          <a href="https://instagram.com/getout_salasdeescape" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            <Instagram size={16} />
          </a>
        </div>
        <p className="text-xs text-muted-foreground/60">
          © 2025 GetOut! Salas de Escape — Necochea, Buenos Aires
        </p>
      </div>
    </footer>
  );
}
