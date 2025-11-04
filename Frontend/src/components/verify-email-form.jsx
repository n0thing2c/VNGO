import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";

// Helper function to extract error message from API response
const getErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data;
    // Check for field-specific errors (email, etc.)
    if (data.email) {
      return Array.isArray(data.email) ? data.email[0] : data.email;
    }
    if (data.detail) return data.detail;
    if (data.token) {
      return Array.isArray(data.token) ? data.token[0] : data.token;
    }
    // If there are other field errors, return the first one
    const errorKeys = Object.keys(data);
    if (errorKeys.length > 0) {
      const firstError = data[errorKeys[0]];
      return Array.isArray(firstError) ? firstError[0] : firstError;
    }
  }
  if (error.request)
    return "No response from server. Please check your connection.";
  if (error.message) return error.message;
  return "Failed to verify email. Please try again.";
};

export function VerifyEmailForm({ className, ...props }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [status, setStatus] = useState("pending"); // pending, verifying, success, error
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  // Get email from localStorage (set after signup)
  const pendingEmail = localStorage.getItem("pendingVerificationEmail");

  const handleEmailVerification = useCallback(
    async (verificationToken) => {
      try {
        setIsLoading(true);
        setStatus("verifying");
        await authService.verifyEmail(verificationToken);
        setIsVerified(true);
        setStatus("success");
        toast.success("Email verified successfully!");
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
      } catch (error) {
        setStatus("error");
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (token) {
      handleEmailVerification(token);
    }
  }, [token, handleEmailVerification]);

  // Clean up email from localStorage after successful verification
  useEffect(() => {
    if (status === "success") {
      localStorage.removeItem("pendingVerificationEmail");
    }
  }, [status]);

  const handleResendEmail = useCallback(async () => {
    if (!pendingEmail || !pendingEmail.trim()) {
      toast.error("Email not found. Please sign up again.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(pendingEmail.trim())) {
      toast.error("Invalid email format. Please sign up again.");
      return;
    }

    try {
      setIsResending(true);
      await authService.resendVerificationEmail(pendingEmail.trim());
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  }, [pendingEmail]);

  return (
    <div
      className={cn("flex flex-col items-center pb-4", className)}
      {...props}
    >
      <Card className="mx-auto mt-2 md:mt-0 w-[92%] md:max-w-2xl overflow-hidden p-0 shadow-xl">
        <CardContent className="p-6 md:p-8">
          <FieldGroup className="gap-4 text-center">
            <div className="flex flex-col items-center gap-2 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold">
                Email Verification
              </h1>
            </div>

            {status === "pending" && !token && (
              <>
                <Field>
                  <div className="py-8">
                    <div className="text-6xl mb-4">📧</div>
                    <p className="text-lg mb-2 font-medium">Check your email</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      We've sent a verification link to your email address.
                      Please click the link in the email to verify your account.
                    </p>
                    <FieldDescription className="text-xs">
                      The verification link will expire in 10 minutes.
                    </FieldDescription>
                  </div>
                </Field>

                <Field>
                  <div className="flex flex-col gap-3">
                    <FieldDescription className="text-xs mb-2">
                      Didn't receive the email? Check your spam folder or resend the verification email.
                    </FieldDescription>
                    {pendingEmail && (
                      <Button
                        onClick={handleResendEmail}
                        disabled={isResending}
                        variant="outline"
                        className="w-full"
                      >
                        {isResending ? "Sending..." : "Resend Verification Email"}
                      </Button>
                    )}
                    <FieldDescription className="text-xs mt-2">
                      Or{" "}
                      <a href="/signup" className="text-primary underline">
                        sign up again
                      </a>
                      .
                    </FieldDescription>
                  </div>
                </Field>
              </>
            )}

            {status === "verifying" && (
              <Field>
                <div className="py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-lg font-medium">Verifying your email...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Please wait while we verify your email address.
                  </p>
                </div>
              </Field>
            )}

            {status === "success" && (
              <Field>
                <div className="py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-lg mb-2 font-medium text-green-600">
                    Email Verified Successfully!
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Your email has been verified. You can now sign in to your
                    account.
                  </p>
                  <Button
                    onClick={() => navigate("/signin")}
                    className="w-full"
                  >
                    Go to Sign In
                  </Button>
                </div>
              </Field>
            )}

            {status === "error" && (
              <Field>
                <div className="py-8">
                  <div className="text-6xl mb-4">❌</div>
                  <p className="text-lg mb-2 font-medium text-red-600">
                    Verification Failed
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    The verification link is invalid or has expired. Please
                    request a new verification email.
                  </p>
                  <div className="flex flex-col gap-3">
                    {pendingEmail && (
                      <Button
                        onClick={handleResendEmail}
                        disabled={isResending}
                        variant="outline"
                        className="w-full"
                      >
                        {isResending ? "Sending..." : "Resend Verification Email"}
                      </Button>
                    )}
                    <Button
                      onClick={() => navigate("/signup")}
                      variant="outline"
                      className="w-full"
                    >
                      Sign Up Again
                    </Button>
                    <Button
                      onClick={() => navigate("/signin")}
                      className="w-full"
                    >
                      Go to Sign In
                    </Button>
                  </div>
                </div>
              </Field>
            )}
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
