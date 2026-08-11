"use client";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import WhyChoose from "@/components/landing/WhyChoose";
import DashboardPreview from "@/components/landing/DashboardPreview";
import AISection from "@/components/landing/AISection";
import Statistics from "@/components/landing/Statistics";
import CTA from "@/components/landing/CTA";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
      <Navbar />
      <Hero />
      <Features />
      <WhyChoose />
      <DashboardPreview />
      <AISection />
      <Statistics />
      <CTA />
      <Contact />
      <Footer />
    </main>
  );
}