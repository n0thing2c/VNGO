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

export function InfoForm({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col items-center pb-4", className)}
      {...props}
    ></div>
  );
}
