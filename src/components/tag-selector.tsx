"use client";

import type { CatalogModel } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, ExternalLink } from "lucide-react";

interface TagSelectorProps {
  model: CatalogModel;
  onSelect: (fullName: string) => void;
  disabled?: boolean;
}

export function TagSelector({ model, onSelect, disabled }: TagSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={<Button variant="outline" size="sm" disabled={disabled} />}
      >
        Pull
        <ChevronDown className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {model.tags.map((tag) => (
          <DropdownMenuItem
            key={tag}
            onClick={() => onSelect(`${model.name}:${tag}`)}
          >
            {model.name}:{tag}
            {tag === model.default_tag && (
              <span className="ml-auto text-xs text-muted-foreground">
                (default)
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => window.open(model.url, "_blank")}
        >
          All tags
          <ExternalLink className="ml-auto size-3" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
