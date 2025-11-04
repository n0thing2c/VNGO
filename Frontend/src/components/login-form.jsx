import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import SignUpImg from "@/assets/sign_up_img.png";
import { authService } from "@/services/authService";
import { useState } from "react";
import { useNavigate } from "react-router";

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

export function LoginForm({ className, ...props }) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");
  };

  return (
    <div
      className={cn("flex flex-col items-center pb-4", className)}
      {...props}
    >
      <Card className="mx-auto mt-2 md:mt-0 w-[92%]  md:max-w-4xl overflow-hidden p-0 shadow-xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-3 md:p-5" onSubmit={handleSubmit}>
            <FieldGroup className="gap-3 md:gap-4 text-sm">
              <div className="flex flex-col items-center gap-1 text-center mb-1 md:mb-2">
                <h1 className="text-xl md:text-2xl font-bold">Log in</h1>
              </div>

              <Field>
                <FieldLabel className="text-sm" htmlFor="username">
                  Username
                </FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="username"
                  required
                  className="h-9 text-sm"
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
                      className="h-9 text-sm"
                    />
                  </Field>
                </Field>
              </Field>

              <Field>
                <Button
                  className="w-full md:w-auto h-9 px-4 text-sm"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Log in"}
                </Button>
              </Field>

              <FieldDescription className="text-center text-sm">
                Don't have an account? <a href="/signup">Sign up</a>
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
