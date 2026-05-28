import { LandingNav } from './landing-nav';
import { HeroSection } from './hero-section';
import { LogoMarquee } from './logo-marquee';
import { AppShowcase } from './app-showcase';
import { FeaturesSection } from './features-section';
import { FeaturesDarkSection } from './features-dark-section';
import { PhilosophySection } from './philosophy-section';
import { TestimonialsSection } from './testimonials-section';
import { CtaSection } from './cta-section';
import { MarqueeTicker } from './marquee-ticker';
import { LandingFooter } from './landing-footer';

export function LandingPage() {
  return (
    <div className="landing-page min-h-screen overflow-x-hidden bg-background">
      <LandingNav />
      <HeroSection />
      <LogoMarquee />
      <AppShowcase />
      <FeaturesSection />
      <FeaturesDarkSection />
      <PhilosophySection />
      <TestimonialsSection />
      <CtaSection />
      <MarqueeTicker />
      <LandingFooter />
    </div>
  );
}
