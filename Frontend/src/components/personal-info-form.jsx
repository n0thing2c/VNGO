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

export function InfoForm({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col items-center pb-4", className)}
      {...props}
    ></div>
  );
}
