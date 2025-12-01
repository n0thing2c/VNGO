import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import ImageUploader from "@/components/imageuploader.jsx";
import { useAuthStore } from "@/stores/useAuthStore.js";
import { profileService } from "@/services/profileService.js";
import { Combobox } from "@/components/ui/combobox.jsx";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constant.js";
// Updated: Initial data is mostly cleared for a fresh guide entry
const DEFAULT_AVATAR = "https://placehold.co/112x112/A0A0A0/ffffff?text=User";

const initialProfile = {
    firstName: "",
    lastName: "",
    age: "",
    gender: "Female",
    nationality: "",
    profilePictureUrl: DEFAULT_AVATAR,
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

const NATIONALITIES = [
    { value: "Afghan", label: "Afghan" },
    { value: "Albanian", label: "Albanian" },
    { value: "Algerian", label: "Algerian" },
    { value: "American", label: "American" },
    { value: "Andorran", label: "Andorran" },
    { value: "Angolan", label: "Angolan" },
    { value: "Antiguans", label: "Antiguans" },
    { value: "Argentine", label: "Argentine" },
    { value: "Armenian", label: "Armenian" },
    { value: "Australian", label: "Australian" },
    { value: "Austrian", label: "Austrian" },
    { value: "Azerbaijani", label: "Azerbaijani" },
    { value: "Bahamian", label: "Bahamian" },
    { value: "Bahraini", label: "Bahraini" },
    { value: "Bangladeshi", label: "Bangladeshi" },
    { value: "Barbadian", label: "Barbadian" },
    { value: "Belarusian", label: "Belarusian" },
    { value: "Belgian", label: "Belgian" },
    { value: "Belizean", label: "Belizean" },
    { value: "Beninese", label: "Beninese" },
    { value: "Bhutanese", label: "Bhutanese" },
    { value: "Bolivian", label: "Bolivian" },
    { value: "Bosnian", label: "Bosnian" },
    { value: "Brazilian", label: "Brazilian" },
    { value: "British", label: "British" },
    { value: "Bruneian", label: "Bruneian" },
    { value: "Bulgarian", label: "Bulgarian" },
    { value: "Burkinabe", label: "Burkinabe" },
    { value: "Burmese", label: "Burmese" },
    { value: "Burundian", label: "Burundian" },
    { value: "Cambodian", label: "Cambodian" },
    { value: "Cameroonian", label: "Cameroonian" },
    { value: "Canadian", label: "Canadian" },
    { value: "Cape Verdean", label: "Cape Verdean" },
    { value: "Central African", label: "Central African" },
    { value: "Chadian", label: "Chadian" },
    { value: "Chilean", label: "Chilean" },
    { value: "Chinese", label: "Chinese" },
    { value: "Colombian", label: "Colombian" },
    { value: "Comorian", label: "Comorian" },
    { value: "Congolese", label: "Congolese" },
    { value: "Costa Rican", label: "Costa Rican" },
    { value: "Croatian", label: "Croatian" },
    { value: "Cuban", label: "Cuban" },
    { value: "Cypriot", label: "Cypriot" },
    { value: "Czech", label: "Czech" },
    { value: "Danish", label: "Danish" },
    { value: "Djiboutian", label: "Djiboutian" },
    { value: "Dominican", label: "Dominican" },
    { value: "Dutch", label: "Dutch" },
    { value: "East Timorese", label: "East Timorese" },
    { value: "Ecuadorean", label: "Ecuadorean" },
    { value: "Egyptian", label: "Egyptian" },
    { value: "Emirati", label: "Emirati" },
    { value: "Equatorial Guinean", label: "Equatorial Guinean" },
    { value: "Eritrean", label: "Eritrean" },
    { value: "Estonian", label: "Estonian" },
    { value: "Ethiopian", label: "Ethiopian" },
    { value: "Fijian", label: "Fijian" },
    { value: "Finnish", label: "Finnish" },
    { value: "French", label: "French" },
    { value: "Gabonese", label: "Gabonese" },
    { value: "Gambian", label: "Gambian" },
    { value: "Georgian", label: "Georgian" },
    { value: "German", label: "German" },
    { value: "Ghanaian", label: "Ghanaian" },
    { value: "Greek", label: "Greek" },
    { value: "Grenadian", label: "Grenadian" },
    { value: "Guatemalan", label: "Guatemalan" },
    { value: "Guinean", label: "Guinean" },
    { value: "Guyanese", label: "Guyanese" },
    { value: "Haitian", label: "Haitian" },
    { value: "Honduran", label: "Honduran" },
    { value: "Hungarian", label: "Hungarian" },
    { value: "Icelander", label: "Icelander" },
    { value: "Indian", label: "Indian" },
    { value: "Indonesian", label: "Indonesian" },
    { value: "Iranian", label: "Iranian" },
    { value: "Iraqi", label: "Iraqi" },
    { value: "Irish", label: "Irish" },
    { value: "Israeli", label: "Israeli" },
    { value: "Italian", label: "Italian" },
    { value: "Ivorian", label: "Ivorian" },
    { value: "Jamaican", label: "Jamaican" },
    { value: "Japanese", label: "Japanese" },
    { value: "Jordanian", label: "Jordanian" },
    { value: "Kazakh", label: "Kazakh" },
    { value: "Kenyan", label: "Kenyan" },
    { value: "Kittitian/Nevisian", label: "Kittitian/Nevisian" },
    { value: "Kuwaiti", label: "Kuwaiti" },
    { value: "Kyrgyz", label: "Kyrgyz" },
    { value: "Laotian", label: "Laotian" },
    { value: "Latvian", label: "Latvian" },
    { value: "Lebanese", label: "Lebanese" },
    { value: "Liberian", label: "Liberian" },
    { value: "Libyan", label: "Libyan" },
    { value: "Liechtensteiner", label: "Liechtensteiner" },
    { value: "Lithuanian", label: "Lithuanian" },
    { value: "Luxembourgish", label: "Luxembourgish" },
    { value: "Macedonian", label: "Macedonian" },
    { value: "Malagasy", label: "Malagasy" },
    { value: "Malawian", label: "Malawian" },
    { value: "Malaysian", label: "Malaysian" },
    { value: "Maldivian", label: "Maldivian" },
    { value: "Malian", label: "Malian" },
    { value: "Maltese", label: "Maltese" },
    { value: "Marshallese", label: "Marshallese" },
    { value: "Mauritanian", label: "Mauritanian" },
    { value: "Mauritian", label: "Mauritian" },
    { value: "Mexican", label: "Mexican" },
    { value: "Micronesian", label: "Micronesian" },
    { value: "Moldovan", label: "Moldovan" },
    { value: "Monacan", label: "Monacan" },
    { value: "Mongolian", label: "Mongolian" },
    { value: "Moroccan", label: "Moroccan" },
    { value: "Mozambican", label: "Mozambican" },
    { value: "Namibian", label: "Namibian" },
    { value: "Nauruan", label: "Nauruan" },
    { value: "Nepalese", label: "Nepalese" },
    { value: "New Zealander", label: "New Zealander" },
    { value: "Nicaraguan", label: "Nicaraguan" },
    { value: "Nigerien", label: "Nigerien" },
    { value: "North Korean", label: "North Korean" },
    { value: "Norwegian", label: "Norwegian" },
    { value: "Omani", label: "Omani" },
    { value: "Pakistani", label: "Pakistani" },
    { value: "Palauan", label: "Palauan" },
    { value: "Palestinian", label: "Palestinian" },
    { value: "Panamanian", label: "Panamanian" },
    { value: "Papua New Guinean", label: "Papua New Guinean" },
    { value: "Paraguayan", label: "Paraguayan" },
    { value: "Peruvian", label: "Peruvian" },
    { value: "Philippine", label: "Philippine" },
    { value: "Polish", label: "Polish" },
    { value: "Portuguese", label: "Portuguese" },
    { value: "Qatari", label: "Qatari" },
    { value: "Romanian", label: "Romanian" },
    { value: "Russian", label: "Russian" },
    { value: "Rwandan", label: "Rwandan" },
    { value: "Saint Lucian", label: "Saint Lucian" },
    { value: "Salvadoran", label: "Salvadoran" },
    { value: "Samoan", label: "Samoan" },
    { value: "San Marinese", label: "San Marinese" },
    { value: "Saudi", label: "Saudi" },
    { value: "Scottish", label: "Scottish" },
    { value: "Senegalese", label: "Senegalese" },
    { value: "Serbian", label: "Serbian" },
    { value: "Seychellois", label: "Seychellois" },
    { value: "Sierra Leonean", label: "Sierra Leonean" },
    { value: "Singaporean", label: "Singaporean" },
    { value: "Slovak", label: "Slovak" },
    { value: "Slovenian", label: "Slovenian" },
    { value: "Solomon Islander", label: "Solomon Islander" },
    { value: "Somali", label: "Somali" },
    { value: "South African", label: "South African" },
    { value: "South Korean", label: "South Korean" },
    { value: "South Sudanese", label: "South Sudanese" },
    { value: "Spanish", label: "Spanish" },
    { value: "Sri Lankan", label: "Sri Lankan" },
    { value: "Sudanese", label: "Sudanese" },
    { value: "Surinamese", label: "Surinamese" },
    { value: "Swazi", label: "Swazi" },
    { value: "Swedish", label: "Swedish" },
    { value: "Swiss", label: "Swiss" },
    { value: "Syrian", label: "Syrian" },
    { value: "Taiwanese", label: "Taiwanese" },
    { value: "Tajik", label: "Tajik" },
    { value: "Tanzanian", label: "Tanzanian" },
    { value: "Thai", label: "Thai" },
    { value: "Togolese", label: "Togolese" },
    { value: "Tongan", label: "Tongan" },
    { value: "Trinidadian", label: "Trinidadian" },
    { value: "Tunisian", label: "Tunisian" },
    { value: "Turkish", label: "Turkish" },
    { value: "Turkmen", label: "Turkmen" },
    { value: "Tuvaluan", label: "Tuvaluan" },
    { value: "Ugandan", label: "Ugandan" },
    { value: "Ukrainian", label: "Ukrainian" },
    { value: "Uruguayan", label: "Uruguayan" },
    { value: "Uzbek", label: "Uzbek" },
    { value: "Vanuatuan", label: "Vanuatuan" },
    { value: "Venezuelan", label: "Venezuelan" },
    { value: "Vietnamese", label: "Vietnamese" },
    { value: "Yemeni", label: "Yemeni" },
    { value: "Zambian", label: "Zambian" },
    { value: "Zimbabwean", label: "Zimbabwean" }
];


export function TouristProfile({ className }) {
    const [profileId, setProfileId] = useState(null);
    const [profile, setProfile] = useState(initialProfile);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [avatarImages, setAvatarImages] = useState([]);
    const navigate = useNavigate();
    const refreshUser = useAuthStore((state) => state.refreshUser);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        if (user?.id) {
            setProfileId(user.id);
        } else if (user && !user.id) {
            refreshUser().then((updatedUser) => {
                if (updatedUser?.id) {
                    setProfileId(updatedUser.id);
                }
            });
        }
    }, [user, refreshUser]);

    const fullName = useMemo(() => {
        const parts = [profile.firstName, profile.lastName]
            .map((part) => part?.trim())
            .filter(Boolean);
        return parts.join(" ");
    }, [profile.firstName, profile.lastName]);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await profileService.getMyProfile();
                if (user?.id) {
                    setProfileId(user.id);
                }
                const [first = "", ...rest] = (data.name || "").split(" ");
                setProfile({
                    firstName: first,
                    lastName: rest.join(" "),
                    age: data.age?.toString() || "",
                    gender: data.gender || "Female",
                    nationality: data.nationality || "",
                    profilePictureUrl: data.face_image || DEFAULT_AVATAR,
                });
                setAvatarImages(
                    data.face_image ? [{ file: null, url: data.face_image }] : []
                );
            } catch (error) {
                toast.error(
                    error?.response?.data?.detail ||
                    "Unable to load your profile. Please try again."
                );
            } finally {
                setIsLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleAvatarChange = (images) => {
        const latestImage = images.slice(-1);
        setAvatarImages(latestImage);
        setProfile((prev) => ({
            ...prev,
            profilePictureUrl: latestImage[0]?.url || DEFAULT_AVATAR,
        }));
    };

    // Handler for all input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    // Simulation of the save/update process
    const handleSave = async (event) => {
        event.preventDefault();
        setIsSaving(true);

        // Trim values for safe validation
        const firstName = profile.firstName?.trim();
        const lastName = profile.lastName?.trim();
        const ageNum = Number(profile.age);
        const gender = profile.gender;
        const nationality = profile.nationality;

        // Validation checks
        if (!firstName) {
            toast.error("Please enter your first name.");
            setIsSaving(false);
            return;
        }

        if (!lastName) {
            toast.error("Please enter your last name.");
            setIsSaving(false);
            return;
        }

        if (!Number.isFinite(ageNum) || ageNum <= 0) {
            toast.error("Please enter a valid age.");
            setIsSaving(false);
            return;
        }

        if (!gender) {
            toast.error("Please select a gender.");
            setIsSaving(false);
            return;
        }

        if (!nationality) {
            toast.error("Please select a nationality.");
            setIsSaving(false);
            return;
        }

        try {
            let faceImageUrl = "";
            if (avatarImages.length === 0) {
                faceImageUrl = "";
            } else if (avatarImages[0]?.file) {
                const uploadRes = await profileService.uploadProfileImage(
                    avatarImages[0].file
                );
                faceImageUrl = uploadRes.url;
            } else {
                faceImageUrl = profile.profilePictureUrl;
            }

            await profileService.updateMyProfile({
                name: `${firstName} ${lastName}`,
                age: ageNum,
                gender,
                nationality,
                face_image: faceImageUrl,
            });

            await refreshUser();

            // Update local state after save
            setProfile((prev) => ({
                ...prev,
                profilePictureUrl: faceImageUrl || DEFAULT_AVATAR,
            }));
            if (faceImageUrl) {
                setAvatarImages([{ file: null, url: faceImageUrl }]);
            }

            toast.success("Profile saved successfully!");
            // If this was the first time (registration), navigate to home
            if (!user?.profile_completed) {
                navigate("/", { replace: true });
            }
        } catch (error) {
            toast.error(
                error?.response?.data?.detail ||
                "Failed to save profile. Please try again."
            );
        } finally {
            setIsSaving(false);
        }
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
                                Profile picture
                            </h2>
                            <div
                                className="relative h-40 w-40 rounded-full overflow-hidden border-3 border-white ring-2 ring-gray-300 shadow-md">
                                <img
                                    src={profile.profilePictureUrl}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = DEFAULT_AVATAR;
                                    }}
                                />
                            </div>

                            <ImageUploader
                                images={avatarImages}
                                allowThumbnail={false}
                                onImagesChange={handleAvatarChange}
                                showPreview={false}
                            />
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
                                        disabled={isLoading}
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
                                        disabled={isLoading}
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
                                        min={1}
                                        max={120}
                                        value={profile.age}
                                        onChange={(e) => {
                                            setProfile((prev) => ({ ...prev, age: e.target.value }));
                                        }}
                                        onBlur={() => {
                                            let val = Number(profile.age);

                                            // Auto adjust if out of bounds
                                            if (!val || val < 1) val = 1;
                                            if (val > 120) val = 120;

                                            setProfile((prev) => ({ ...prev, age: val.toString() }));
                                        }}
                                        className="h-10 text-base"
                                        disabled={isLoading}
                                    />
                                </FormField>

                                {/* Gender Select Dropdown */}
                                <FormField label="Gender">
                                    <Select
                                        value={profile.gender}
                                        onValueChange={(val) => setProfile((prev) => ({ ...prev, gender: val }))}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger className="flex h-10 py-2 appearance-none w-auto">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormField>

                            </div>

                            {/* Nationality */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Nationality">
                                    {/*<Input*/}
                                    {/*  id="nationality"*/}
                                    {/*  name="nationality"*/}
                                    {/*  type="text"*/}
                                    {/*  required*/}
                                    {/*  value={profile.nationality}*/}
                                    {/*  onChange={handleInputChange}*/}
                                    {/*  className="h-10 text-base"*/}
                                    {/*  placeholder="e.g. American, Japanese"*/}
                                    {/*  disabled={isLoading}*/}
                                    {/*/>*/}
                                    <Combobox
                                        items={NATIONALITIES}
                                        value={profile.nationality}
                                        setValue={(val) => setProfile((prev) => ({ ...prev, nationality: val }))}
                                        placeholder="Select nationality"
                                        className="flex"
                                    />
                                </FormField>
                            </div>
                        </div>

                        {/* Action Buttons are kept outside the rounded border for clarity */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Link
                                to={profileId ? ROUTES.TOURIST_PUBLIC_PROFILE(profileId) : "#"}
                                className={`inline-block ${!profileId ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 px-4 text-sm rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Eye size={16} />
                                    View Public Profile
                                </Button>
                            </Link>

                            <Button
                                className="h-10 px-6 text-sm rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg transition duration-150 ease-in-out"
                                type="submit"
                                disabled={isSaving || isLoading}
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
