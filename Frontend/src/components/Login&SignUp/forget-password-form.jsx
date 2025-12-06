import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field.jsx";
import { Input } from "@/components/ui/input.jsx";
import { toast } from "sonner";
import { authService } from "@/services/authService.js";
import { useState } from "react";
import { useNavigate } from "react-router";

// Helper function to extract error message from API response
const getErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data;
    if (data.email) {
      return Array.isArray(data.email) ? data.email[0] : data.email;
    }
    if (data.detail) return data.detail;
    const errorKeys = Object.keys(data);
    if (errorKeys.length > 0) {
      const firstError = data[errorKeys[0]];
      return Array.isArray(firstError) ? firstError[0] : firstError;
    }
  }
  if (error.request)
    return "No response from server. Please check your connection.";
  if (error.message) return error.message;
  return "Failed to send reset email. Please try again.";
};

export function ForgetPasswordForm({ className, ...props }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");

    try {
      setIsLoading(true);
      await authService.forgetPassword(email);
      setIsSubmitted(true);
      toast.success(
        "If this email is registered, a password reset link will be sent."
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn("flex flex-col items-center pb-4", className)}
      {...props}
    >
      <Card className="mx-auto mt-2 md:mt-11 w-[92%] md:max-w-2xl overflow-hidden p-0 shadow-xl">
        <CardContent className="p-6 md:p-8">
          <FieldGroup className="gap-4 text-center">
            <div className="flex flex-col items-center gap-2 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold">
                Forget Password
              </h1>
            </div>

            {!isSubmitted ? (
              <>
                <Field>
                  <FieldLabel className="text-sm" htmlFor="email">
                    Email
                  </FieldLabel>
                  <form onSubmit={handleSubmit}>
                    <FieldGroup className="gap-4">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        className="h-9 text-sm"
                      />
                      <Button
                        className="w-full md:w-auto h-9 px-4 text-sm"
                        type="submit"
                        disabled={isLoading}
                      >
                        {isLoading ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </FieldGroup>
                  </form>
                </Field>

                <FieldDescription className="text-xs">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </FieldDescription>
              </>
            ) : (
              <Field>
                <div className="py-8">
                  <div className="text-6xl mb-4">📧</div>
                  <p className="text-lg mb-2 font-medium">Check your email</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    If this email is registered, we've sent a password reset
                    link to your email address. Please check your inbox and
                    follow the instructions to reset your password.
                  </p>
                  <FieldDescription className="text-xs mb-4">
                    The reset link will expire in 60 minutes.
                  </FieldDescription>
                  <Button
                    onClick={() => navigate("/login")}
                    variant="outline"
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>
              </Field>
            )}

            <FieldDescription className="text-center text-sm">
              Remember your password?{" "}
              <a href="/login" className="text-primary underline">
                Sign in
              </a>
            </FieldDescription>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

