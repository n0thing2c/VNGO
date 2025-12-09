import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field.jsx";
import { Input } from "@/components/ui/input.jsx";
import { toast } from "sonner";
import SignUpImg from "@/assets/sign_up_img.png";
import { useAuthStore } from "@/stores/useAuthStore.js";
import { useNavigate, Link } from "react-router";
import { useState } from "react";

// Helper function to extract error message from API response
const getErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data;
    // Check field-specific errors first (email, username, password, role)
    const fieldErrors = ["email", "username", "password", "role"];
    for (const field of fieldErrors) {
      if (data[field]) {
        return Array.isArray(data[field]) ? data[field][0] : data[field];
      }
    }
    // Check general errors
    if (data.detail) return data.detail;
    if (data.non_field_errors) {
      return Array.isArray(data.non_field_errors)
        ? data.non_field_errors[0]
        : data.non_field_errors;
    }
  }
  if (error.request)
    return "No response from server. Please check your connection.";
  if (error.message) return error.message;
  return "Failed to create account. Please try again.";
};

export function SignupForm({ className, ...props }) {
  const { signUp, loading } = useAuthStore();
  const navigate = useNavigate();
  const [hasAgreed, setHasAgreed] = useState(false);
  const [role, setRole] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const username = formData.get("username");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirm-password");
    // let role = formData.get("role");

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!role) {
      toast.error("Please select a role");
      return;
    }

    if (!hasAgreed) {
      toast.error("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    // Normalize role to lowercase (backend expects "tourist" or "guide")
    // role = role.toLowerCase();
    const roleLower = role.toLowerCase();

    try {
      await signUp(username, email, password, roleLower);
      // Store email in sessionStorage for resend functionality (cleared when tab closes)
      sessionStorage.setItem("pendingVerificationEmail", email);
      toast.success("Please check your email to verify your account.");
      // Redirect to verify email page
      setTimeout(() => {
        navigate("/verify-email");
      }, 1500);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div
      className={cn("flex flex-col items-center pb-4", className)}
      {...props}
    >
      <Card className="mx-auto mt-2 md:mt-8.5 w-[92%]  md:max-w-4xl overflow-hidden p-0 shadow-xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-3 md:p-5" onSubmit={handleSubmit}>
            <FieldGroup className="gap-3 md:gap-4 text-sm">
              <div className="flex flex-col items-center gap-1 text-center mb-1 md:mb-2">
                <h1 className="text-xl md:text-2xl font-bold">Sign up</h1>
              </div>

              <Field>
                <FieldLabel className="text-sm" htmlFor="email">
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  className="rounded-full h-9 text-sm"
                />
              </Field>

              <Field>
                <FieldLabel className="text-sm" htmlFor="username">
                  Username
                </FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="username"
                  required
                  className="rounded-full h-9 text-sm"
                />
              </Field>

              <Field>
                <Field className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel className="text-sm" htmlFor="password">
                      Password
                    </FieldLabel>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="rounded-full h-9 text-sm"
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm" htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      required
                      className="rounded-full h-9 text-sm"
                    />
                  </Field>
                </Field>
                <FieldDescription className="text-xs text-gray-400">
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel className="text-sm font-medium">
                  Choose your role
                </FieldLabel>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-12">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="role"
                      value="Guide"
                      className="h-3.5 w-3.5"
                      checked={role === "Guide"}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    />
                    <span>Guide</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="role"
                      value="tourist"
                      className="h-3.5 w-3.5"
                      checked={role === "tourist"}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    />
                    <span>Tourist</span>
                  </label>
                </div>
              </Field>

              <Field>
                <div className="mt-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="tos-agree"
                      className="h-4 w-4 mt-0.5 flex-shrink-0"
                      checked={hasAgreed}
                      onChange={(e) => setHasAgreed(e.target.checked)}
                    />
                    <label htmlFor="tos-agree" className="select-none text-left">
                      By clicking, you agree to our{" "}
                      <Link
                        to="/terms-of-service"
                        className="text-primary underline"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        to="/privacy-policy"
                        className="text-primary underline"
                      >
                        Privacy Policy
                      </Link>
                      {role === "Guide" && (
                        <>
                          {" "}
                          and{" "}
                          <Link
                            to="/guide-policy"
                            className="text-primary underline"
                          >
                            Guide Policy
                          </Link>
                        </>
                      )}
                      .
                    </label>
                  </div>
                </div>
                <Button
                  className="rounded-full w-full md:w-auto h-9 px-4 text-sm mt-3"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Sign up"}
                </Button>
              </Field>

              <FieldDescription className="text-center text-sm">
                Already have an account? <a href="/login">Sign in</a>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="relative hidden md:block">
            <img
              src={SignUpImg}
              alt="Sign up"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
