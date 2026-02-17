import React from "react";
import * as Recharts from "recharts";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const THEMES = { light: "", dark: ".dark" };

const ChartContext = React.createContext(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used inside ChartContainer");
  }
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <Recharts.ResponsiveContainer>
          {children}
        </Recharts.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }) {
  if (!config) return null;

  const colorConfig = Object.entries(config).filter(
    ([, item]) => item.color || item.theme
  );

  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, item]) => {
    const color =
      item.theme?.[theme] || item.color;
    return color ? `--color-${key}: ${color};` : "";
  })
  .join("\n")}
}`
          )
          .join("\n"),
      }}
    />
  );
}

const ChartTooltip = Recharts.Tooltip;
const ChartLegend = Recharts.Legend;

function ChartTooltipContent({
  active,
  payload,
  className,
}) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-2 text-xs shadow",
        className
      )}
    >
      {payload.map((item) => {
        const key = item.dataKey;
        const itemConfig = config?.[key];

        return (
          <div
            key={key}
            className="flex justify-between gap-2"
          >
            <span>{itemConfig?.label || item.name}</span>
            <span>{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

function ChartLegendContent({ payload }) {
  const { config } = useChart();

  if (!payload?.length) return null;

  return (
    <div className="flex justify-center gap-4">
      {payload.map((item) => {
        const key = item.dataKey;
        const itemConfig = config?.[key];

        return (
          <div
            key={key}
            className="flex items-center gap-1"
          >
            <div
              className="h-2 w-2 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span>{itemConfig?.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
};
