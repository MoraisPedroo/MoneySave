import type { CategoryDef } from "@/lib/categories";
import { getSubscriptionCategory } from "@/lib/categories";
import { getService } from "@/lib/services";
import type { Subscription } from "@/lib/types";
import { cn, hexAlpha, readableOn } from "@/lib/utils";

/** Ícone de categoria em um círculo suave com a cor da categoria. */
export function CategoryIcon({ category, size = 36, className }: { category: CategoryDef; size?: number; className?: string }) {
  const Icon = category.icon;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full", className)}
      style={{ width: size, height: size, backgroundColor: hexAlpha(category.color, 0.14), color: category.color }}
      aria-hidden
    >
      <Icon style={{ width: size * 0.48, height: size * 0.48 }} />
    </span>
  );
}

/** Avatar da assinatura: cor de marca do serviço (Netflix, Spotify...) ou ícone da categoria. */
export function ServiceAvatar({
  subscription,
  size = 40,
  className,
}: {
  subscription: Pick<Subscription, "name" | "serviceSlug" | "category">;
  size?: number;
  className?: string;
}) {
  const service = getService(subscription.serviceSlug);
  if (!service) {
    const category = getSubscriptionCategory(subscription.category);
    const Icon = category.icon;
    return (
      <span
        className={cn("inline-flex shrink-0 items-center justify-center rounded-[28%]", className)}
        style={{ width: size, height: size, backgroundColor: hexAlpha(category.color, 0.15), color: category.color }}
        aria-hidden
      >
        <Icon style={{ width: size * 0.48, height: size * 0.48 }} />
      </span>
    );
  }
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-[28%] font-bold tracking-tight shadow-xs", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: service.color,
        color: readableOn(service.color),
        fontSize: size * 0.36,
      }}
      aria-hidden
    >
      {service.name.charAt(0).toUpperCase()}
    </span>
  );
}
