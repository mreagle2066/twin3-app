import { cn } from "@/lib/utils";

const logoUrl = "/manus-storage/twin3-logo_0f803bad.svg";

export function BrandLogo({ className, label = "Twin3" }: { className?: string; label?: string }) {
  return <img src={logoUrl} alt={`${label} logo`} className={cn("shrink-0 object-contain", className)} />;
}
