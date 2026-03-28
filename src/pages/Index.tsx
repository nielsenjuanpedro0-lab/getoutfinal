import { useScrollReveal } from "@/hooks/useScrollReveal";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import RoomsSection from "@/components/RoomsSection";
import BirthdaySection from "@/components/BirthdaySection";
import HazardDivider from "@/components/HazardDivider";
import TeamBuildingSection from "@/components/TeamBuildingSection";
import ExclusiveSection from "@/components/ExclusiveSection";
import SmokeDivider from "@/components/SmokeDivider";
import HowItWorksSection from "@/components/HowItWorksSection";
import StatsSection from "@/components/StatsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <RoomsSection />
      <BirthdaySection />
      <HazardDivider />
      <ExclusiveSection />
      <SmokeDivider />
      <TeamBuildingSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
