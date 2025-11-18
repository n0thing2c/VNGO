import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx"; // Assuming basic Input component is resolvable
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Upload } from "lucide-react";

// Updated: Initial data is mostly cleared for a fresh guide entry
const initialProfile = {
  firstName: "",
  lastName: "",
  age: 0,
  gender: "Female", // Set a default value
  nationality: "",
  profilePictureUrl: "https://placehold.co/100x100/A0A0A0/ffffff?text=User",
};

// Simple reusable Field component using standard HTML/Tailwind styling
const FormField = ({ label, children }) => (
  <div className="flex flex-col space-y-1.5">
    <label
      htmlFor={children.props.id}
      className="text-sm font-medium text-gray-700"
    >
      {label}
    </label>
    {children}
  </div>
);

export function TouristProfile({ className }) {
  const [profile, setProfile] = useState(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  // Handler for all input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Simulation of the save/update process
  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Basic form validation (e.g., check if age is a number)
    const ageNum = parseInt(profile.age, 10);
    if (isNaN(ageNum) || ageNum <= 0) {
      toast.error("Please enter a valid age.");
      setIsSaving(false);
      return;
    }

    // Console log for simulation
    console.log("Saving profile data:", profile);

    toast.success("Profile saved successfully!");
    setIsSaving(false);
  };

  const handleViewPublicProfile = () => {
    // Navigate to the public profile page (simulated)
    toast.info("Navigating to public profile...");
    // Use a placeholder ID since firstName might be empty now
    const profileIdentifier = profile.firstName || "guest";
    navigate("/profile/" + profileIdentifier);
  };

  // Tailwind classes for the multiline textarea/select to match input styling
  const formElementClasses =
    "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition duration-150 ease-in-out shadow-sm";
  const textareaClasses = formElementClasses + " min-h-[80px] resize-y";

  return (
    <div
      // Removed green background
      className="flex flex-col items-center pb-4 min-h-screen pt-4 bg-white"
    >
      <Card
        // Removed green border-t-4
        className="mx-auto w-[92%] md:max-w-4xl overflow-hidden shadow-xl border border-gray-200"
      >
        <CardContent className="p-0">
          <form className="p-4 md:p-8 space-y-6" onSubmit={handleSave}>
            {/* Profile Picture Section - REMOVED border-b AND pb-6 */}
            <div className="flex flex-col items-center gap-4 text-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Add/change profile picture
              </h2>
              <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-white ring-2 ring-gray-300 shadow-md">
                <img
                  src={profile.profilePictureUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://placehold.co/112x112/A0A0A0/ffffff?text=User";
                  }}
                />
              </div>

              <Button
                type="button"
                variant="link"
                // Changed button color to neutral blue/gray
                className="text-gray-600 hover:text-blue-700 hover:no-underline flex items-center gap-1 text-sm h-auto p-0"
              >
                Upload image
                <Upload className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Form Fields Section - NOW WRAPPED IN ROUNDED BORDER */}
            {/* Added margin-top to separate it from the photo section */}
            <div className="border border-gray-300 rounded-xl p-4 sm:p-6 space-y-6 shadow-sm mt-6">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="First name">
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={profile.firstName}
                    onChange={handleInputChange}
                    className="h-10 text-base"
                  />
                </FormField>

                <FormField label="Last name">
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={profile.lastName}
                    onChange={handleInputChange}
                    className="h-10 text-base"
                  />
                </FormField>
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Age">
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    required
                    value={profile.age === 0 ? "" : profile.age}
                    onChange={handleInputChange}
                    className="h-10 text-base"
                  />
                </FormField>

                {/* Gender Select Dropdown */}
                <FormField label="Gender">
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={profile.gender}
                    onChange={handleInputChange}
                    className={formElementClasses + " h-10 appearance-none"}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </FormField>
              </div>

              {/* Nationality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Nationality">
                  <Input
                    id="nationality"
                    name="nationality"
                    type="text"
                    required
                    value={profile.location}
                    onChange={handleInputChange}
                    className="h-10 text-base"
                    placeholder="e.g. American, Japanese"
                  />
                </FormField>
              </div>
            </div>

            {/* Action Buttons are kept outside the rounded border for clarity */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                className="h-10 px-6 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 shadow-sm"
                type="button"
                onClick={handleViewPublicProfile}
                disabled={isSaving}
              >
                View public profile
              </Button>
              <Button
                className="h-10 px-6 text-sm bg-blue-600 hover:bg-blue-700 shadow-lg transition duration-150 ease-in-out"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"
                      viewBox="0 0 24 24"
                    ></svg>
                    Saving...
                  </div>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
