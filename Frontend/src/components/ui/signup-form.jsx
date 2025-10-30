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

export function SignupForm({ className, ...props }) {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const username = formData.get("username");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirm-password");
    const role = formData.get("role");

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!role) {
      toast.error("Please select a role");
      return;
    }
  };

  return (
    <div
      className={cn("flex flex-col items-center pb-4", className)}
      {...props}
    >
      <Card className="mx-auto mt-2 md:mt-0 w-[92%]  md:max-w-4xl overflow-hidden p-0 shadow-xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-4 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup className="gap-4 md:gap-6">
              <div className="flex flex-col items-center gap-2 text-center mb-0 md:mb-0">
                <h1 className="text-2xl md:text-3xl font-bold">Sign up</h1>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input id="username" name="username" type="username" required />
              </Field>

              <Field>
                <Field className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      required
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>

              <Field>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-8">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="role"
                      value="tourguide"
                      className="h-4 w-4"
                      required
                    />
                    <span>Tourguide</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="role"
                      value="tourist"
                      className="h-4 w-4"
                      required
                    />
                    <span>Tourist</span>
                  </label>
                </div>
              </Field>

              <Field>
                <Button className="w-full md:w-auto" type="submit">
                  Sign up
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Already have an account? <a href="/signin">Sign in</a>
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

      <FieldDescription className="px-6 text-center mt-3">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
