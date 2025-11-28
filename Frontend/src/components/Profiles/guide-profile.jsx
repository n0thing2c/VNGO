import {Button} from "@/components/ui/button.jsx";
import {Card, CardContent} from "@/components/ui/card.jsx";
import {Input} from "@/components/ui/input.jsx";
import {toast} from "sonner";
// import {useNavigate} from "react-router";
import {useEffect, useMemo, useState} from "react";
import ImageUploader from "@/components/imageuploader.jsx";
import {useAuthStore} from "@/stores/useAuthStore.js";
import {profileService} from "@/services/profileService.js";
import {Combobox} from "@/components/ui/combobox.jsx";
import {LanguageSelector} from "@/components/lang_selector.jsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.jsx";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";

// Updated: Initial data is mostly cleared for a fresh guide entry
const DEFAULT_AVATAR = "https://placehold.co/112x112/A0A0A0/ffffff?text=User";

const initialProfile = {
    firstName: "",
    lastName: "",
    age: "",
    gender: "Female", // Set a default value
    languages: [],
    location: "",
    bio: "",
    profilePictureUrl: DEFAULT_AVATAR,
};

const province = [
    { value: "Lao Cai", label: "Lao Cai" },
    { value: "Tuyen Quang", label: "Tuyen Quang" },
    { value: "Thai Nguyen", label: "Thai Nguyen" },
    { value: "Hanoi", label: "Hanoi" },
    { value: "Hai Phong", label: "Hai Phong" },
    { value: "Bac Ninh", label: "Bac Ninh" },
    { value: "Hung Yen", label: "Hung Yen" },
    { value: "Ninh Binh", label: "Ninh Binh" },
    { value: "Phu Tho", label: "Phu Tho" },
    { value: "Hue", label: "Hue" },
    { value: "Quang Tri", label: "Quang Tri" },
    { value: "Da Nang", label: "Da Nang" },
    { value: "Quang Ngai", label: "Quang Ngai" },
    { value: "Gia Lai", label: "Gia Lai" },
    { value: "Dak Lak", label: "Dak Lak" },
    { value: "Lam Dong", label: "Lam Dong" },
    { value: "Khanh Hoa", label: "Khanh Hoa" },
    { value: "Dong Nai", label: "Dong Nai" },
    { value: "Tay Ninh", label: "Tay Ninh" },
    { value: "Ho Chi Minh City", label: "Ho Chi Minh City" },
    { value: "Vinh Long", label: "Vinh Long" },
    { value: "Can Tho", label: "Can Tho" },
    { value: "An Giang", label: "An Giang" },
    { value: "Ca Mau", label: "Ca Mau" }
];


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

export function GuideProfile({className}) {
    const [profileId, setProfileId] = useState(null);
    const [profile, setProfile] = useState(initialProfile);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [avatarImages, setAvatarImages] = useState([]);
    // const navigate = useNavigate();
    const refreshUser = useAuthStore((state) => state.refreshUser);

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
                setProfileId(data.id);
                const [first = "", ...rest] = (data.name || "").split(" ");
                setProfile({
                    firstName: first,
                    lastName: rest.join(" "),
                    age: data.age?.toString() || "",
                    gender: data.gender || "Female",
                    languages: Array.isArray(data.languages) ? data.languages : [],
                    location: data.location || "",
                    bio: data.bio || "",
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

    const handleSave = async (event) => {
        event.preventDefault();
        setIsSaving(true);

        // Validate age
        const ageNum = Number(profile.age);
        if (!Number.isFinite(ageNum) || ageNum <= 0) {
            toast.error("Please enter a valid age.");
            setIsSaving(false);
            return;
        }

        // Validate location (required)
        if (!profile.location) {
            toast.error("Please select your location.");
            setIsSaving(false);
            return;
        }


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

        try {
            await profileService.updateMyProfile({
                name: fullName,
                age: ageNum,
                gender: profile.gender,
                languages: profile.languages.filter(Boolean),
                location: profile.location,
                face_image: faceImageUrl,
                bio: profile.bio,
            });
            await refreshUser();
            toast.success("Profile saved successfully!");
            // navigate("/", {replace: true});
        } catch (error) {
            toast.error(
                error?.response?.data?.detail || "Failed to save profile. Please try again."
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

                            {/* Languages & Location */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Languages">
                                    <LanguageSelector
                                        value={profile.languages} // already an array
                                        onChange={(langs) =>
                                            setProfile((prev) => ({ ...prev, languages: langs }))
                                        }
                                    />
                                </FormField>


                                <FormField label="Location">
                                    {/*<Input*/}
                                    {/*  id="location"*/}
                                    {/*  name="location"*/}
                                    {/*  type="text"*/}
                                    {/*  required*/}
                                    {/*  value={profile.location}*/}
                                    {/*  onChange={handleInputChange}*/}
                                    {/*  className="h-10 text-base"*/}
                                    {/*  placeholder="e.g. Hanoi, Ho Chi Minh city"*/}
                                    {/*  disabled={isLoading}*/}
                                    {/*/>*/}
                                    <Combobox
                                        items={province}
                                        // id="location"
                                        // name="location"
                                        value={profile.location}
                                        setValue={(newValue) =>
                                            setProfile((prev) => ({ ...prev, location: newValue }))
                                        }
                                        className="flex"
                                        required={true}
                                    />
                                </FormField>
                            </div>

                            {/* Bio */}
                            <FormField label="Bio">
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={profile.bio}
                                    onChange={handleInputChange}
                                    className={textareaClasses + " min-h-[180px]"}
                                    placeholder="Tell tourists about your experience and expertise."
                                    disabled={isLoading}
                                />
                            </FormField>
                        </div>

                        {/* Action Buttons are kept outside the rounded border for clarity */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Link
                              to={profileId ? `/public-profile/${profileId}` : "#"}
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
