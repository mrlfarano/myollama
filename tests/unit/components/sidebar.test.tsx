import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/link to render an <a> tag
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

import { Sidebar } from "@/components/sidebar";

describe("Sidebar", () => {
  it("renders all 4 nav links", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Sidebar />);

    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Models")).toBeInTheDocument();
    expect(screen.getByText("Modelfiles")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders correct hrefs for all nav links", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Sidebar />);

    const libraryLink = screen.getByText("Library").closest("a");
    const modelsLink = screen.getByText("Models").closest("a");
    const modelfilesLink = screen.getByText("Modelfiles").closest("a");
    const settingsLink = screen.getByText("Settings").closest("a");

    expect(libraryLink).toHaveAttribute("href", "/");
    expect(modelsLink).toHaveAttribute("href", "/models");
    expect(modelfilesLink).toHaveAttribute("href", "/modelfiles");
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });

  it("highlights Library link when on root path", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Sidebar />);

    const libraryLink = screen.getByText("Library").closest("a");
    const modelsLink = screen.getByText("Models").closest("a");

    // Active link has bg-accent class
    expect(libraryLink?.className).toContain("bg-accent");
    expect(modelsLink?.className).not.toContain("bg-accent ");
  });

  it("highlights Models link when on /models path", () => {
    mockUsePathname.mockReturnValue("/models");
    render(<Sidebar />);

    const libraryLink = screen.getByText("Library").closest("a");
    const modelsLink = screen.getByText("Models").closest("a");

    expect(libraryLink?.className).not.toContain("bg-accent ");
    expect(modelsLink?.className).toContain("bg-accent");
  });

  it("highlights Settings link when on /settings path", () => {
    mockUsePathname.mockReturnValue("/settings");
    render(<Sidebar />);

    const settingsLink = screen.getByText("Settings").closest("a");
    expect(settingsLink?.className).toContain("bg-accent");
  });
});
