# LibreChat AI Assistant — Demo Prompts

Use these prompts with the Saivers AI Assistant (ClickHouse MCP) on the Admin Investigation page.

---

## Usage & Comparisons

- Which household had the highest energy usage in the last 7 days? (ask)
- Compare peak vs off-peak consumption for the neighborhood this week.
- What is the total kWh and cost for each household today?
- Which household is furthest above its baseline this week?

---

## Anomalies

- Which households have the most anomalies in the last 7 days? (ask)
- Show me the highest anomaly scores and when they occurred. (ask)
- Which time slots have the most anomalies?
- Are anomalies concentrated in certain households or spread across the neighborhood?

---

## Trends Over Time

- How has total neighborhood consumption changed over the last 7 days? (ask)
- Which days had the highest peak usage?
- Is energy usage increasing or decreasing compared to last week?
- What are the busiest consumption hours (by slot_idx)?

---

## AC-Related

- Which households have AC running during peak hours?
- What is the average AC power draw by household?
- Are there households with AC on overnight (e.g. slots 40–48)?
- Compare AC usage across households for the last 3 days.

---

## Aggregates & Summaries

- What is the neighborhood total kWh for the last 7 days?
- How many active homes contributed to today's consumption?
- What is the total cost (SGD) and carbon (kg) for the neighborhood the past 2 weeks? (ask)
- Which flat type (4-room, 5-room, etc.) uses the most energy on average? (ask)

---

## Investigative

- Why might household 1002 have higher usage than others?
- Which households should we investigate for unusual patterns?
- Is there a correlation between anomaly count and total kWh?
- Which time slots show the largest gap between actual and baseline usage?
