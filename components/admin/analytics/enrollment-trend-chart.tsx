"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface EnrollmentTrendChartProps {
  data: Array<{
    date: string
    count: number
  }>
}

export function EnrollmentTrendChart({ data }: EnrollmentTrendChartProps) {
  const { t, locale } = useI18n()
  const a = t.academyAdmin
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US'

  const chartData = data.map((item) => ({
    ...item,
    label: new Intl.DateTimeFormat(dateLocale, {
      weekday: 'short',
      day: 'numeric',
    }).format(new Date(`${item.date}T00:00:00`)),
  }))

  const chartConfig = {
    count: {
      label: a.dashEnrollments,
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <CardTitle>{a.dashEnrollmentTrend}</CardTitle>
            <CardDescription>{a.dashEnrollmentTrendDesc}</CardDescription>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <TrendingUp className="size-5" aria-hidden="true" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={32}
              orientation={locale === 'ar' ? 'right' : 'left'}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="count"
              type="monotone"
              fill="var(--color-count)"
              fillOpacity={0.15}
              stroke="var(--color-count)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
