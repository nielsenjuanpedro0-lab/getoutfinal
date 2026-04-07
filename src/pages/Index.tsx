import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import RoomsSection from "@/components/RoomsSection";
import BirthdaySection from "@/components/BirthdaySection";
import HazardDivider from "@/components/HazardDivider";
import ExclusiveSection from "@/components/ExclusiveSection";
import SmokeDivider from "@/components/SmokeDivider";
import TeamBuildingSection from "@/components/TeamBuildingSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import ContactSection from "@/components/ContactSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ContactInfoSection from "@/components/ContactInfoSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  useScrollReveal();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      toast.success("¡Pago acreditado! Tu reserva está confirmada.", {
        description: "Te enviaremos un WhatsApp con los detalles.",
        duration: 8000,
      });
      // Limpiar el parámetro de la URL
      setSearchParams({}, { replace: true });
    } else if (status === "failure") {
      toast.error("Hubo un problema con el pago.", {
        description: "Si el dinero se debitó, contactanos por WhatsApp.",
        duration: 8000,
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      {/* Salas + carrusel + precios */}
      <RoomsSection />

      {/* Eventos especiales: cumpleaños, turnos exclusivos, team building */}
      <section id="eventos-especiales">
        <BirthdaySection />
        <ExclusiveSection />
        <SmokeDivider />
        <TeamBuildingSection />
        <HazardDivider />
      </section>

      {/* Reservar + cómo funciona */}
      <ContactSection />
      <HowItWorksSection />

      {/* Reseñas al fondo */}
      <TestimonialsSection />

      {/* Contacto: WhatsApp, Instagram, dirección, mapa */}
      <ContactInfoSection />

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
