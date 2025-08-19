import React from "react";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <Navbar />
      <HeroSection />
    </div>
  );
};

export default HomePage;
