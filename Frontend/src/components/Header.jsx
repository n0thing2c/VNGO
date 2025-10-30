import Logo from "@/assets/LogoVNGO.png";

export default function Header() {
  return (
    <div
      className="w-full"
      style={{
        background:
          "linear-gradient(180deg, #347FE2 0%, #59AEF1 50%, #FFFFFF 100%)",
      }}
    >
      <div className="w-full max-w-6xl px-4  h-20 relative">
        <img
          src={Logo}
          alt="VNGO"
          className="h-20 w-auto absolute top-0 left-0"
        />
      </div>
    </div>
  );
}
