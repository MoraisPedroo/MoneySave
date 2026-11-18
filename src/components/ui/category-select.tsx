"use client";

import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import type { CategoryDef } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/bank/avatars";
import { fieldBase } from "./input";

/** Seletor compacto de categoria (uma linha), com ícone e cor de cada categoria. */
export function CategorySelect({
  value,
  onChange,
  categories,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  categories: CategoryDef[];
  id?: string;
}) {
  const current = categories.find((c) => c.id === value) ?? categories[0];
  return (
    <SelectPrimitive.Root value={current.id} onValueChange={onChange}>
      <SelectPrimitive.Trigger
        id={id}
        aria-label="Categoria"
        className={cn(fieldBase, "flex h-10 items-center justify-between gap-2 py-1.5 text-left data-[placeholder]:text-muted-foreground")}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CategoryIcon category={current} size={26} />
          <span className="truncate">
            <SelectPrimitive.Value />
          </span>
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-[60] max-h-[min(20rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] min-w-56 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <SelectPrimitive.Viewport className="p-1">
            {categories.map((category) => (
              <SelectPrimitive.Item
                key={category.id}
                value={category.id}
                className="relative flex cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pr-8 pl-1.5 text-sm outline-none select-none data-[highlighted]:bg-muted"
              >
                <CategoryIcon category={category} size={26} />
                <SelectPrimitive.ItemText>{category.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2">
                  <Check className="size-4 text-primary" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
