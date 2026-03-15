import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CatalogModel } from "@/types";

// Mock the context hooks
vi.mock("@/contexts/pull-context", () => ({
  usePull: () => ({
    pulls: new Map(),
    startPull: vi.fn(),
  }),
}));

vi.mock("@/contexts/connection-context", () => ({
  useConnection: () => ({
    status: "connected",
    ollamaUrl: "http://localhost:11434",
    refresh: vi.fn(),
  }),
}));

// Mock the TagSelector since it uses DropdownMenu with complex rendering
vi.mock("@/components/tag-selector", () => ({
  TagSelector: ({
    model,
    disabled,
  }: {
    model: CatalogModel;
    onSelect: (name: string) => void;
    disabled?: boolean;
  }) => (
    <button disabled={disabled} data-testid="tag-selector">
      Pull {model.name}
    </button>
  ),
}));

import { ModelCard } from "@/components/model-card";

const mockModel: CatalogModel = {
  name: "llama3",
  description: "A powerful language model by Meta",
  categories: ["chat", "code"],
  tags: ["8b", "70b"],
  default_tag: "8b",
  size_category: "medium",
  url: "https://ollama.com/library/llama3",
};

describe("ModelCard", () => {
  it("shows model name and description", () => {
    render(<ModelCard model={mockModel} />);
    expect(screen.getByText("llama3")).toBeInTheDocument();
    expect(
      screen.getByText("A powerful language model by Meta")
    ).toBeInTheDocument();
  });

  it("shows category badges", () => {
    render(<ModelCard model={mockModel} />);
    expect(screen.getByText("chat")).toBeInTheDocument();
    expect(screen.getByText("code")).toBeInTheDocument();
  });

  it("shows size category badge", () => {
    render(<ModelCard model={mockModel} />);
    expect(screen.getByText("medium")).toBeInTheDocument();
  });

  it('shows "Installed" badge when installed=true', () => {
    render(<ModelCard model={mockModel} installed={true} />);
    expect(screen.getByText("Installed")).toBeInTheDocument();
  });

  it('does not show "Installed" badge when installed=false', () => {
    render(<ModelCard model={mockModel} installed={false} />);
    expect(screen.queryByText("Installed")).not.toBeInTheDocument();
  });

  it('does not show "Installed" badge when installed is undefined', () => {
    render(<ModelCard model={mockModel} />);
    expect(screen.queryByText("Installed")).not.toBeInTheDocument();
  });
});
