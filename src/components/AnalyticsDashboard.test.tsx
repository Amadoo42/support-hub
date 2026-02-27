import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import AnalyticsDashboard from "./AnalyticsDashboard";

const mockState = vi.hoisted(() => ({
  removeChannel: vi.fn(),
  ticketsChangeHandler: null as (() => void) | null,
  auditInsertHandler: null as (() => void) | null,
  fromCall: 0,
}));

const openCounts = [2, 1];
const resolvedCounts = [0, 1];
const categories = [
  [{ category: "Billing" }, { category: "Billing" }],
  [{ category: "Billing" }],
];

vi.mock("@/integrations/supabase/client", () => {
  const channel = {
    on: vi.fn((_event, filter, callback) => {
      if (filter.table === "tickets") mockState.ticketsChangeHandler = callback;
      if (filter.table === "audit_logs") mockState.auditInsertHandler = callback;
      return channel;
    }),
    subscribe: vi.fn(() => channel),
  };

  return {
    supabase: {
      from: vi.fn((table: string) => {
        const cycle = Math.floor(mockState.fromCall / 3);
        const phase = mockState.fromCall % 3;
        mockState.fromCall += 1;

        if (phase === 0 && table === "tickets") {
          return {
            select: vi.fn(() => ({
              neq: vi.fn().mockResolvedValue({ count: openCounts[cycle] ?? openCounts[openCounts.length - 1], error: null }),
            })),
          };
        }

        if (phase === 1 && table === "audit_logs") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn().mockResolvedValue({ count: resolvedCounts[cycle] ?? resolvedCounts[resolvedCounts.length - 1], error: null }),
              })),
            })),
          };
        }

        return {
          select: vi.fn(() => ({
            neq: vi.fn().mockResolvedValue({ data: categories[cycle] ?? categories[categories.length - 1], error: null }),
          })),
        };
      }),
      channel: vi.fn(() => channel),
      removeChannel: mockState.removeChannel,
    },
  };
});

vi.mock("recharts", () => ({
  PieChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("AnalyticsDashboard", () => {
  beforeEach(() => {
    mockState.fromCall = 0;
    mockState.ticketsChangeHandler = null;
    mockState.auditInsertHandler = null;
    mockState.removeChannel.mockClear();
  });

  it("refreshes totals after realtime status changes", async () => {
    const { unmount } = render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Total Open Tickets").parentElement).toHaveTextContent("2");
      expect(screen.getByText("Resolved Today").parentElement).toHaveTextContent("0");
    });

    act(() => {
      mockState.ticketsChangeHandler?.();
    });

    await waitFor(() => {
      expect(screen.getByText("Total Open Tickets").parentElement).toHaveTextContent("1");
      expect(screen.getByText("Resolved Today").parentElement).toHaveTextContent("1");
    });

    unmount();
    expect(mockState.removeChannel).toHaveBeenCalled();
  });
});
