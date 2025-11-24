import { Button } from "@/components/ui/button.jsx";
import { Combobox } from "@/components/ui/combobox.jsx";
import { Trash2 } from "lucide-react";

const ALL_LANGUAGES = [
  "Amharic", "Arabic", "Azerbaijani", "Bengali", "Bhojpuri", "Burmese",
  "English", "Fula", "French", "German", "Gujarati", "Hakka", "Hausa",
  "Hindi", "Igbo", "Indonesian/Malay", "Italian", "Japanese", "Javanese",
  "Kannada", "Korean", "Maithili", "Malay/Indonesian", "Malayalam",
  "Mandarin Chinese", "Marathi", "Oromo", "Oriya", "Pashto", "Persian",
  "Polish", "Punjabi", "Romanian", "Russian", "Sindebele", "Sindhi",
  "Sinhalese", "Spanish", "Sunda", "Tagalog", "Telugu", "Thai", "Turkish",
  "Ukrainian", "Urdu", "Vietnamese", "Wu Chinese", "Yoruba"
].sort();

export function LanguageSelector({ value = [], onChange }) {
  const languages = value;

  const handleAddLanguage = () => {
    // prevent adding a new blank if all languages are already used
    if (languages.length >= ALL_LANGUAGES.length) return;
    onChange([...languages, ""]);
  };

  const handleRemoveLanguage = (index) => {
    if (languages.length === 1) return; // always keep at least one
    onChange(languages.filter((_, i) => i !== index));
  };

  const handleChange = (index, val) => {
    // prevent duplicates
    if (languages.includes(val) && val !== languages[index]) return;

    const updated = [...languages];
    updated[index] = val;
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-2">
      {languages.map((lang, i) => (
        <div key={i} className="flex items-center gap-2">
          <Combobox
            items={ALL_LANGUAGES.map((l) => ({ value: l, label: l }))}
            value={lang}
            setValue={(val) => handleChange(i, val)}
            className="flex-1"
            placeholder="Select language"
            required
          />
          {languages.length > 1 && (
            <Button
              type="button"
              onClick={() => handleRemoveLanguage(i)}
              className="bg-transparent text-red hover:bg-gray-200 border border-gray-300"
            >
              <Trash2 color="red"/>
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        onClick={handleAddLanguage}
        className="bg-gray-800 text-white text-sm hover:bg-white hover:border hover:border-gray-800 hover:text-gray-800"
      >
        Add Language
      </Button>
    </div>
  );
}
