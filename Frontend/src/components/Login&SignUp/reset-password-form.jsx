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
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { MailCheck, MailX } from "lucide-react";

// Helper function to extract error message from API response
const getErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data;
    if (data.token) {
      return Array.isArray(data.token) ? data.token[0] : data.token;
    }
    if (data.new_password) {
      return Array.isArray(data.new_password)
        ? data.new_password[0]
        : data.new_password;
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
  return "Failed to reset password. Please try again.";
};

export function ResetPasswordForm({ className, ...props }) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("pending"); // pending, resetting, success, error
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const hasResetRef = useRef(false); // Track if reset has been attempted

  const handlePasswordReset = useCallback(
    async (resetToken, newPassword) => {
      // Prevent multiple calls with the same token
      if (hasResetRef.current) {
        return;
      }

      try {
        hasResetRef.current = true; // Mark as attempted
        setIsLoading(true);
        setStatus("resetting");
        await authService.resetPassword(resetToken, newPassword);
        setStatus("success");
        toast.success("Password has been reset successfully!");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } catch (error) {
        setStatus("error");
        toast.error(getErrorMessage(error));
        // Reset ref on error so user can retry if needed
        hasResetRef.current = false;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      toast.error(
        "Reset token is missing. Please use the link from your email."
      );
      return;
    }

    const formData = new FormData(event.currentTarget);
    const newPassword = formData.get("new_password");
    const confirmPassword = formData.get("confirm_password");

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    await handlePasswordReset(token, newPassword);
  };

  return (
    <div
      className={cn("flex flex-col items-center pb-4", className)}
      {...props}
    >
      <Card className="mx-auto mt-2 md:mt-9.5 w-[92%] md:max-w-2xl overflow-hidden p-0 shadow-xl">
        <CardContent className="p-6 md:p-8">
          <FieldGroup className="gap-4 text-center">
            <div className="flex flex-col items-center gap-2 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold">Reset Password</h1>
            </div>

            {!token && status === "pending" && (
              <Field>
                <div className="py-8">
                  <div className="flex justify-center mb-4">
                    <MailX className="w-16 h-16 text-red-600" />
                  </div>
                  <p className="text-lg mb-2 font-medium text-red-600">
                    Invalid Reset Link
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    The reset link is invalid or missing. Please request a new
                    password reset.
                  </p>
                  <Button
                    onClick={() => navigate("/forget-password")}
                    variant="outline"
                    className="w-full"
                  >
                    Request New Reset Link
                  </Button>
                </div>
              </Field>
            )}

            {token && status === "pending" && (
              <form onSubmit={handleSubmit}>
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel className="text-sm" htmlFor="new_password">
                      New Password
                    </FieldLabel>
                    <Input
                      id="new_password"
                      name="new_password"
                      type="password"
                      required
                      minLength={8}
                      className="h-9 text-sm"
                      placeholder="Enter new password"
                    />
                    <FieldDescription className="text-xs">
                      Must be at least 8 characters long.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm" htmlFor="confirm_password">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      required
                      minLength={8}
                      className="h-9 text-sm"
                      placeholder="Confirm new password"
                    />
                  </Field>

                  <Field>
                    <Button
                      className="w-full h-9 px-4 text-sm"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            )}

            {status === "resetting" && (
              <Field>
                <div className="py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-lg font-medium">
                    Resetting your password...
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Please wait while we reset your password.
                  </p>
                </div>
              </Field>
            )}

            {status === "success" && (
              <Field>
                <div className="py-8">
                  <div className="flex justify-center mb-4">
                    <MailCheck className="w-16 h-16 text-green-600" />
                  </div>
                  <p className="text-lg mb-2 font-medium text-green-600">
                    Password Reset Successfully!
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Your password has been reset. You can now sign in with your
                    new password.
                  </p>
                  <Button onClick={() => navigate("/login")} className="w-full">
                    Go to Sign In
                  </Button>
                </div>
              </Field>
            )}

            {status === "error" && (
              <Field>
                <div className="py-8">
                  <div className="flex justify-center mb-4">
                    <MailX className="w-16 h-16 text-red-600" />
                  </div>
                  <p className="text-lg mb-2 font-medium text-red-600">
                    Reset Failed
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    The reset link is invalid or has expired. Please request a
                    new password reset.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => navigate("/forget-password")}
                      variant="outline"
                      className="w-full"
                    >
                      Request New Reset Link
                    </Button>
                    <Button
                      onClick={() => navigate("/login")}
                      className="w-full"
                    >
                      Go to Sign In
                    </Button>
                  </div>
                </div>
              </Field>
            )}

            {status === "pending" && token && (
              <FieldDescription className="text-center text-sm">
                Remember your password?{" "}
                <a href="/login" className="text-primary underline">
                  Sign in
                </a>
              </FieldDescription>
            )}
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
