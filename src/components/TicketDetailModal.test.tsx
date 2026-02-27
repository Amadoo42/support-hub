import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import TicketDetailModal from "./TicketDetailModal";

const mockState = vi.hoisted(() => ({
  removeChannel: vi.fn(),
  auditInsertHandler: null as ((payload: { new: unknown }) => void) | null,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "admin-user" } }),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
  TabsContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/integrations/supabase/client", () => {
  const channel = {
    on: vi.fn((_event, filter, callback) => {
      if (filter.table === "audit_logs") {
        mockState.auditInsertHandler = callback;
      }
      return channel;
    }),
    subscribe: vi.fn(() => channel),
  };

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === "ticket_messages" || table === "audit_logs") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
          };
        }

        return {
          from: vi.fn(),
        };
      }),
      channel: vi.fn(() => channel),
      removeChannel: mockState.removeChannel,
    },
  };
});

describe("TicketDetailModal", () => {
  beforeEach(() => {
    mockState.auditInsertHandler = null;
    mockState.removeChannel.mockClear();
    Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("updates audit history when a new audit log event is received", async () => {
    const ticket = {
      id: "ticket-1",
      category: "Billing",
      description: "Need help with billing",
      status: "Open",
      created_at: "2026-02-27T00:00:00.000Z",
    };

    const { unmount } = render(<TicketDetailModal ticket={ticket} open onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("No status changes recorded yet.")).toBeInTheDocument();
    });

    act(() => {
      mockState.auditInsertHandler?.({
        new: {
          id: "log-1",
          ticket_id: "ticket-1",
          old_status: "Open",
          new_status: "Resolved",
          changed_by: "admin-user",
          created_at: "2026-02-27T01:00:00.000Z",
        },
      });
    });

    await waitFor(() => {
      const historyItem = screen.getByText(/Status changed from/i).parentElement;
      expect(historyItem).toHaveTextContent("Open");
      expect(historyItem).toHaveTextContent("Resolved");
    });

    unmount();
    expect(mockState.removeChannel).toHaveBeenCalled();
  });
});
