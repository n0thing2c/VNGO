import { AchievementBadge } from "@/components/achievement/achievementbadges.jsx";

const ACHIEVEMENT_REQUIREMENT = {
  liked: "Rating ≥ 3.5",
  loved: "Rating ≥ 4.0",
  "people's choice": "Rating ≥ 4.7",

  multilingual: "Speak ≥ 3 languages",
  polygot: "Speak ≥ 5 languages",

  "rookie guide": "Complete ≥ 1 tour",
  "rising guide": "Complete ≥ 10 tours",
  "experienced guide": "Complete ≥ 50 tours",
  "master guide": "Complete ≥ 100 tours",
  "legendary guide": "Complete ≥ 500 tours",

  "rookie crafter": "Offer ≥ 1 tour",
  "apprentice crafter": "Offer ≥ 10 tours",
  "skilled artist": "Offer ≥ 30 tours",
  "master artist": "Offer ≥ 50 tours",
  "master architect": "Offer ≥ 100 tours",
};

function AchievementDialog({ achieved = [] }) {
  const allKeys = Object.keys(ACHIEVEMENT_REQUIREMENT);
  const achievedLower = achieved.map(a => a.toLowerCase());

  return (
    <div className="grid grid-cols-5 gap-7 mb-5 w-full max-w-full justify-center items-center mt-5">
  {allKeys.map((key, idx) => {
    const isAchieved = achievedLower.includes(key.toLowerCase());

    return (
      <div
        key={idx}
        className="flex justify-center relative transform scale-120"
      >
        {isAchieved ? (
          <AchievementBadge variant={key.toLowerCase()} label={key} />
        ) : (
          <AchievementBadge
            variant="locked"
            label={ACHIEVEMENT_REQUIREMENT[key]}
          />
        )}
      </div>
    );
  })}
</div>

  );
}

export { AchievementDialog };
