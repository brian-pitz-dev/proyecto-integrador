"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/nav/nav-items";

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="hidden min-w-0 items-center gap-2 overflow-x-auto lg:flex">
      {NAV_ITEMS.map(({ href, label, Icon }, i) => {
        const active = pathname.startsWith(href);
        return (
          <Fragment key={href}>
            {i > 0 && <div className="h-6 w-px shrink-0 bg-border" aria-hidden="true" />}
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-lg px-4 py-2 text-lg font-medium transition-colors",
                active
                  ? "bg-accent/15 text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
