import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import notFoundImage from "@/assets/404.jpg";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[90vh] w-full overflow-hidden">
      {/* Full screen image */}
      <img
        src={notFoundImage}
        alt="404 Not Found"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Return to homepage button */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10">
        <Button
          onClick={() => navigate("/")}
          size="lg"
          className="px-8 shadow-lg"
        >
          Return to Homepage
        </Button>
      </div>
    </div>
  );
}
