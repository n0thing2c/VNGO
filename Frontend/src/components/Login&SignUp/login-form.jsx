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
import { useNavigate } from "react-router";

// Helper function to extract error message from API response
const getErrorMessage = (error) => {
  if (error.response?.status === 401) {
    return "Username or password is incorrect";
  }
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
  return "Failed to sign in. Please try again.";
};

export function LoginForm({ className, ...props }) {
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const routeMap = {
    tourist: "/tourist-profile",
    guide: "/guide-profile",
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");
    try {
      const user = await login(username, password);
      toast.success("Logged in successfully");
      const shouldGoToProfile =
        user?.profile_completed === false && user?.role && routeMap[user.role];

      if (shouldGoToProfile) {
        navigate(routeMap[user.role], { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    }
  };

  return (
    <div
      className={cn("flex flex-col items-center pb-4", className)}
      {...props}
    >
      <Card className="mx-auto mt-2 md:mt-11 w-[92%]  md:max-w-4xl overflow-hidden p-0 shadow-xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup className="gap-6 md:gap-8 text-sm">
              <div className="flex flex-col items-center gap-2 text-center mb-3 md:mb-4">
                <h1 className="text-2xl md:text-3xl font-bold">Log in</h1>
              </div>

              <Field>
                <FieldLabel className="text-base mb-2" htmlFor="username">
                  Username
                </FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="username"
                  required
                  className="rounded-full h-12 text-base"
                />
              </Field>

              <Field>
                <FieldLabel className="text-base mb-2" htmlFor="password">
                  Password
                </FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="rounded-full h-12 text-base"
                />
                <div className="flex justify-end mt-1">
                  <a
                    href="/forget-password"
                    className="text-sm text-primary underline"
                  >
                    Forget password?
                  </a>
                </div>
              </Field>

              <Field>
                <Button
                  className="w-full rounded-full md:w-auto h-12 px-6 text-base"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Log in"}
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
