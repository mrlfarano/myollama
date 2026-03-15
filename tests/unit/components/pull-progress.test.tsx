import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PullProgress } from "@/components/pull-progress";
import type { PullState } from "@/types";

describe("PullProgress", () => {
  it('shows "Pulling manifest..." for pulling status', () => {
    const state: PullState = { model: "llama3:8b", status: "pulling" };
    render(<PullProgress state={state} />);
    expect(screen.getByText("Pulling manifest...")).toBeInTheDocument();
  });

  it("shows progress bar with percentage for downloading status", () => {
    const state: PullState = {
      model: "llama3:8b",
      status: "downloading",
      total: 4_000_000_000,
      completed: 2_000_000_000,
    };
    render(<PullProgress state={state} />);
    // 2GB / 4GB = 50%
    expect(screen.getByText(/50%/)).toBeInTheDocument();
    expect(screen.getByText(/2\.0 GB/)).toBeInTheDocument();
    expect(screen.getByText(/4\.0 GB/)).toBeInTheDocument();
  });

  it('shows "Verifying..." for verifying status', () => {
    const state: PullState = { model: "llama3:8b", status: "verifying" };
    render(<PullProgress state={state} />);
    expect(screen.getByText("Verifying...")).toBeInTheDocument();
  });

  it('shows "Downloaded successfully" for success status', () => {
    const state: PullState = { model: "llama3:8b", status: "success" };
    render(<PullProgress state={state} />);
    expect(screen.getByText("Downloaded successfully")).toBeInTheDocument();
  });

  it("shows error message and Retry button for failed status", () => {
    const onRetry = vi.fn();
    const state: PullState = {
      model: "llama3:8b",
      status: "failed",
      error: "Network timeout",
    };
    render(<PullProgress state={state} onRetry={onRetry} />);
    expect(screen.getByText("Network timeout")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("shows default error message when no error string provided", () => {
    const state: PullState = { model: "llama3:8b", status: "failed" };
    render(<PullProgress state={state} />);
    expect(screen.getByText("Download failed")).toBeInTheDocument();
  });

  it("Retry button calls onRetry callback", async () => {
    const onRetry = vi.fn();
    const state: PullState = {
      model: "llama3:8b",
      status: "failed",
      error: "Network error",
    };
    render(<PullProgress state={state} onRetry={onRetry} />);

    const retryButton = screen.getByText("Retry");
    await userEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
