import medicalBgImage from "../assets/medical-bg.png";
import themeImage from "../assets/theme.png";

export default function HeroSection({
  big_text = "Your health, our priority",
  small_text = "Welcome!",
}) {
  return (
    <div className="relative h-[80vh]">
      {/* Background Image Layers */}
      <div className="absolute inset-0">
        {/* Base medical background */}
        <img
          src={medicalBgImage}
          alt="Medical Background"
          className="absolute w-full h-full object-cover"
        />
        {/* Theme overlay */}
        <img
          src={themeImage}
          alt="Theme Overlay"
          className="absolute w-full h-full object-cover z-10"
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-20 h-full flex flex-col justify-center items-center text-white text-center px-4">
        <h1 className="text-6xl font-bold mb-6">{big_text}</h1>
        <p className="text-2xl">{small_text}</p>
      </div>
    </div>
  );
}
