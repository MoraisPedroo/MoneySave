"use client";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL, formatBRLCompact, monthShort } from "@/lib/format";
import type { TrendPoint } from "@/lib/finance";

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-lg">
      {label ? <p className="mb-1 font-semibold capitalize">{typeof label === "string" && /^\d{4}-\d{2}$/.test(label) ? monthShort(label) : label}</p> : null}
      <div className="grid gap-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.color ?? (entry.payload?.color as string) }} />
              {entry.name}
            </span>
            <span className="money font-medium">{formatBRL(Number(entry.value ?? 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export function DonutChart({ data, total, label }: { data: DonutSlice[]; total: number; label: string }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltip />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="68%"
            outerRadius="100%"
            paddingAngle={data.length > 1 ? 2 : 0}
            cornerRadius={6}
            stroke="none"
            isAnimationActive
          >
            {data.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="money text-lg font-semibold">{formatBRLCompact(total)}</span>
      </div>
    </div>
  );
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis
            dataKey="month"
            tickFormatter={(value: string) => monthShort(value)}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value: number) => formatBRLCompact(value).replace(",00", "")}
            tickLine={false}
            axisLine={false}
            width={72}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
          <Bar dataKey="income" name="Receitas" fill="var(--success)" radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expenses" name="Despesas" fill="var(--destructive)" radius={[6, 6, 0, 0]} maxBarSize={28} opacity={0.85} />
          <Line dataKey="free" name="Sobra" type="monotone" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--chart-2)" }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
