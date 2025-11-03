// export default function Footer() {
//   return (
//     <div
//       style={{
//         background:
//           "linear-gradient(180deg, #FFFFFF 0%, #59AEF1 50%, #347FE2 100%)",
//       }}
//       className="w-full h-50"
//     ></div>
//   );
// }
export default function Footer() {
  return (
    <div
      style={{
        background: "black"
          //"linear-gradient(180deg, #FFFFFF 0%, #59AEF1 50%, #347FE2 100%)",
      }}
      className="w-full p-12 text-white"
    >
      <div className="container mx-auto flex justify-between items-start">
        {/* === CỘT BÊN TRÁI: Brand và Social === */}
        <div className="flex flex-col gap-8">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold">VNG.EXE</h2>
            <p className="text-base">A dev team from © VNGO Corporation</p>
          </div>

          {/* Social Icons */}
          <div className="flex gap-4 items-center">
            <img src="ref" alt="Instagram" className="w-6 h-6" />
            <img src="ref" alt="LinkedIn" className="w-6 h-6" />
            <img src="ref" alt="X" className="w-5 h-5" />
          </div>
        </div>

        {/* === CỘT BÊN PHẢI: Links (dùng flex cho 3 cột) === */}
        <div className="flex gap-16">
          {/* Cột 1: Features */}
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

          {/* Cột 2: Learn more */}
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

          {/* Cột 3: Support */}
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