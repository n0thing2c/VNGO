import { TouristPublicProfile } from "@/components/Profiles/tourist-public-profile.jsx";
import { useParams } from "react-router";

const TouristPublicProfilePage = () => {
  const { touristId } = useParams();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="grow flex flex-col items-center w-full pt-2 md:pt-4 pb-8 md:pb-12">
        <div className="w-full">
          <TouristPublicProfile touristId={touristId} />
        </div>
      </main>
    </div>
  );
};

export default TouristPublicProfilePage;
