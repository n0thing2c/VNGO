import Ig from "@/assets/ig.png";
import LinkedIn from "@/assets/linkedIn.png";
import X from "@/assets/x.png";

export default function Footer() {
  return (
    <div
      style={{
        background: "black",
      }}
      className="w-full p-12 text-white"
    >
      <div className="container mx-auto flex justify-between items-start">
        {/* === LEFT COLUMN: Brand and Social === */}
        <div className="flex flex-col gap-8">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold">VNG.EXE</h2>
            <p className="text-base">A dev team from © VNGO Corporation</p>
          </div>

          {/* Social Icons */}
          <div className="flex gap-4 items-center">
            <img src={Ig} alt="Instagram" className="w-6 h-6" />
            <img src={LinkedIn} alt="LinkedIn" className="w-6 h-6" />
            <img src={X} alt="X" className="w-5 h-5" />
          </div>
        </div>

        {/* === RIGHT COLUMN: Links (using flex for 3 columns) === */}
        <div className="flex gap-16">
          {/* Column 1: Features */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-base mb-2">Features</h3>
            <a href="/" className="text-sm hover:underline">
              Core features
            </a>
            <a href="/" className="text-sm hover:underline">
              Pro experience
            </a>
            <a href="/" className="text-sm hover:underline">
              Integrations
            </a>
          </div>

          {/* Column 2: Learn more */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-base mb-2">Learn more</h3>
            <a href="/" className="text-sm hover:underline">
              Blog
            </a>
            <a href="/" className="text-sm hover:underline">
              Case studies
            </a>
            <a href="/" className="text-sm hover:underline">
              Customer stories
            </a>
            <a href="/" className="text-sm hover:underline">
              Best practices
            </a>
          </div>

          {/* Column 3: Support */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-base mb-2">Support</h3>
            <a href="/" className="text-sm hover:underline">
              Contact
            </a>
            <a href="/" className="text-sm hover:underline">
              Support
            </a>
            <a href="/" className="text-sm hover:underline">
              Legal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
