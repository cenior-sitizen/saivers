"""OpenAI GPT-4o client for generating plain-language energy insights."""

from __future__ import annotations

import os
from functools import lru_cache

from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env regardless of cwd (e.g. when running uvicorn from project root)
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(_env_path)


@lru_cache(maxsize=1)
def get_openai_client():
    from openai import OpenAI
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set in .env")
    return OpenAI(api_key=api_key)


SYSTEM_PROMPT = """You are Saivers, a Singapore household energy coach.
Rules:
- Max 150 words total
- Be specific, empathetic, and actionable
- Use Singapore context (HDB flats, SGD currency, NEA guidelines)
- NEVER calculate numbers — they are provided to you
- Refer to the homeowner by first name
- End with exactly one specific recommended action"""


def generate_insight_text(context: dict) -> str:
    """
    Generate a plain-language energy insight.
    All numeric values must be pre-computed and passed in context — OpenAI only explains.
    """
    try:
        client = get_openai_client()
        prompt = (
            f"Household: {context['name']}, {context['flat_type']}, Punggol\n"
            f"Issue: {context['anomaly_desc']}\n"
            f"Data: AC used {context['actual_kwh']} kWh at {context['time_label']} "
            f"(normal: {context['baseline_kwh']} kWh). "
            f"This happened {context['days']} of the last 7 nights.\n"
            f"If fixed: saves {context['kwh_saved']} kWh · S${context['sgd_saved']} · "
            f"{context['co2_saved']} kg CO₂ per night.\n\n"
            "Write a clear, friendly 2–3 sentence explanation and one specific recommended action."
        )
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=200,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except RuntimeError as e:
        return f"[AI unavailable: {e}] Recommendation: Set your AC to auto-off at 2am to avoid unnecessary cooling."
    except Exception as e:
        return f"Your AC appears to be running at 2am, which increases your electricity usage. Consider setting an auto-off schedule."


ADMIN_SYSTEM_PROMPT = """You are an energy operations analyst for SP Group (Singapore). Generate concise, actionable recommendations.
Rules:
- Output valid JSON only, no markdown or extra text
- Each recommendation: {"priority": "high"|"medium"|"low", "action": "short title", "reason": "1-2 sentences", "household_id": number or null}
- Max 5 recommendations, ordered by priority
- Use household_id only when recommending action for a specific household
- Be specific to the data provided (household IDs, anomaly counts, kWh)
- Use Singapore context (HDB, SGD, peak hours 7am-11pm)"""


def generate_admin_recommendations(
    anomaly_households: list[dict],
    anomalies_summary: dict,
    neighborhood_id: str,
) -> list[dict]:
    """
    Generate AI operational recommendations from anomaly data.
    Returns list of {priority, action, reason, household_id?, region}.
    """
    try:
        client = get_openai_client()
        context = (
            f"Neighborhood: {neighborhood_id}\n"
            f"Last 7 days: {anomalies_summary.get('total_anomalies', 0)} anomalies, "
            f"{anomalies_summary.get('affected_households', 0)} affected households, "
            f"max score {anomalies_summary.get('max_score', 0):.1f}\n"
            f"Households with anomalies today: "
            + ", ".join(
                f"HH{h['household_id']} ({h['name']}): {h['anomaly_count']} events"
                for h in anomaly_households[:10]
            )
        )
        prompt = (
            f"Given this energy anomaly data:\n{context}\n\n"
            "Generate 3-5 operational recommendations as a JSON array. "
            "Include at least one specific household action if anomalies exist. "
            "Set household_id to the household number when recommending action for that household, else null."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": ADMIN_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=500,
            temperature=0.3,
        )
        text = response.choices[0].message.content.strip()
        # Strip markdown code blocks if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        import json
        items = json.loads(text)
        recs = []
        for i, r in enumerate(items[:5]):
            recs.append({
                "priority": r.get("priority", "medium"),
                "action": r.get("action", "Review"),
                "reason": r.get("reason", ""),
                "household_id": r.get("household_id") if r.get("household_id") is not None else None,
                "region": neighborhood_id,
            })
        return recs
    except Exception:
        return []


def generate_incident_summary(
    household_id: int,
    ts: str,
    anomaly_score: float,
    excess_kwh: float,
    severity: str,
) -> str:
    """Generate a human-readable 1-2 sentence summary of an energy anomaly."""
    try:
        client = get_openai_client()
        prompt = (
            f"Summarize this energy anomaly in 1-2 clear sentences for an ops dashboard:\n"
            f"Household {household_id}, timestamp {ts}, anomaly score {anomaly_score:.1f}, "
            f"excess {excess_kwh:.2f} kWh, severity {severity}.\n"
            "Be concise. No markdown."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=80,
            temperature=0.2,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return f"Excess {excess_kwh:.2f} kWh above baseline (score {anomaly_score:.1f})"


def generate_dashboard_summary(
    region: dict,
    grid: dict,
    anomalies: dict,
) -> str:
    """
    Generate a 2-3 sentence AI summary of the admin dashboard.
    Input: region_summary, grid_contribution, anomalies_summary as dicts.
    """
    try:
        client = get_openai_client()
        reduction = grid.get("neighborhood_total_reduction_pct", 0)
        households = grid.get("households", [])[:5]
        above = [h for h in households if h.get("reduction_pct", 0) < 0]
        below = [h for h in households if h.get("reduction_pct", 0) >= 0]
        context = (
            f"Punggol neighbourhood: {region.get('household_count', 0)} households, "
            f"{region.get('total_kwh', 0):.1f} kWh (7d), S${region.get('total_cost_sgd', 0):.2f}, "
            f"peak reduction {reduction:.1f}% vs 4-week baseline.\n"
            f"Anomalies (7d): {anomalies.get('total_anomalies', 0)} total, "
            f"{anomalies.get('affected_households', 0)} affected, max score {anomalies.get('max_score', 0):.1f}.\n"
        )
        if above:
            context += f"Above baseline: HH {', '.join(str(h['household_id']) for h in above)}.\n"
        if below:
            context += f"Below baseline (saving): HH {', '.join(str(h['household_id']) for h in below[:3])}."
        prompt = (
            f"Summarize this energy ops dashboard in 2-3 concise sentences for a grid operator.\n"
            f"Data:\n{context}\n\n"
            "Highlight: peak reduction trend, any households of concern, anomaly status. "
            "Be specific with household IDs. No markdown."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return ""


def generate_observability_summary(
    anomalies: dict,
    households: list[dict],
) -> str:
    """
    Generate an aggregate AI health summary for the observability dashboard.
    Input: anomalies_summary dict, list of HouseholdSummary-like dicts.
    """
    try:
        client = get_openai_client()
        affected = [h for h in households if h.get("anomaly_count", 0) > 0]
        context = (
            f"Last 7 days: {anomalies.get('total_anomalies', 0)} anomalies, "
            f"{anomalies.get('affected_households', 0)} affected households, "
            f"max score {anomalies.get('max_score', 0):.1f}.\n"
        )
        if affected:
            context += "Households with anomalies today: " + ", ".join(
                f"HH{h['household_id']} ({h.get('name', '?')}): {h['anomaly_count']} events"
                for h in affected[:5]
            )
        else:
            context += "No households with anomalies today."
        prompt = (
            f"Summarize this energy telemetry health in 2-3 sentences for an ops team.\n"
            f"Data:\n{context}\n\n"
            "Identify likely root causes (AC usage, peak hours, meter sync) and top recommended action. "
            "Be concise. No markdown."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return ""


def generate_incidents_summary(incidents: list[dict]) -> str:
    """
    Generate a batch briefing summary of all incidents for the last N days.
    Input: list of incident dicts with household_id, ts, severity, description, excess_kwh, anomaly_score.
    """
    try:
        client = get_openai_client()
        if not incidents:
            return "No incidents in the last 7 days. Telemetry is healthy."
        by_hh = {}
        for inc in incidents[:20]:
            hid = inc.get("household_id") or 0
            by_hh[hid] = by_hh.get(hid, 0) + 1
        context = (
            f"{len(incidents)} incidents in last 7 days. "
            f"By household: " + ", ".join(f"HH{k}: {v} events" for k, v in sorted(by_hh.items())[:5]) + ".\n"
            f"Sample: " + "; ".join(
                f"HH{inc.get('household_id')} @ {str(inc.get('ts', ''))[:16]} — {inc.get('severity', '?')}, "
                f"excess {inc.get('excess_kwh', 0):.2f} kWh"
                for inc in incidents[:5]
            )
        )
        prompt = (
            f"Summarize these energy anomaly incidents in 2-3 sentences for an ops briefing.\n"
            f"Data:\n{context}\n\n"
            "Highlight: which households need attention, common patterns, suggested next step. No markdown."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return ""


def explain_anomaly(
    household_id: int,
    ts: str,
    anomaly_score: float,
    excess_kwh: float,
    extra_context: str | None = None,
) -> str:
    """
    Generate a detailed explanation of why an anomaly occurred.
    Optional extra_context from ClickHouse (e.g. baseline, slot, neighborhood).
    """
    try:
        client = get_openai_client()
        base = (
            f"Household {household_id} had an energy anomaly at {ts}: "
            f"score {anomaly_score:.1f}, excess {excess_kwh:.2f} kWh."
        )
        if extra_context:
            base += f"\nAdditional data: {extra_context}"
        prompt = (
            f"{base}\n\n"
            "Explain in 2-4 sentences what likely caused this and what an ops team should check. "
            "Consider: AC usage, peak hours, meter sync, baseline drift. Be specific. No markdown."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Unable to generate explanation: {e}"


def generate_why_explanation(context: dict) -> dict:
    """
    Generate a deeply personalized "Why this works for YOU" explanation.

    context keys:
      name, flat_type, neighborhood, action_title, potential_saving_sgd,
      avg_daily_runtime_h, peak_hour_range, this_week_kwh, vs_last_week_pct,
      current_temp_c, highest_weekday, singapore_season, season_notes,
      how_steps (list[str])

    Returns: {explanation: str, factors: list[str]}
    """
    try:
        client = get_openai_client()

        factors = []
        behaviour_lines = []

        if context.get("avg_daily_runtime_h"):
            h = context["avg_daily_runtime_h"]
            behaviour_lines.append(f"- AC runs avg {h:.1f}h/day")
            factors.append(f"Your {h:.1f}h average daily runtime")

        if context.get("peak_hour_range"):
            behaviour_lines.append(f"- Peak AC hours: {context['peak_hour_range']}")
            factors.append(f"Peak usage at {context['peak_hour_range']}")

        if context.get("current_temp_c"):
            t = context["current_temp_c"]
            behaviour_lines.append(f"- Current AC temperature: {t}°C")
            factors.append(f"Your current {t}°C setting")

        if context.get("this_week_kwh"):
            kwh = context["this_week_kwh"]
            pct = context.get("vs_last_week_pct", 0)
            direction = "↑" if pct > 0 else "↓"
            behaviour_lines.append(f"- This week: {kwh:.1f} kWh ({direction}{abs(pct):.1f}% vs last week)")
            factors.append(f"This week's {kwh:.1f} kWh usage")

        if context.get("highest_weekday"):
            behaviour_lines.append(f"- Highest usage day: {context['highest_weekday']}")

        factors.append(f"{context.get('singapore_season', 'Singapore climate')}")
        factors.append(f"{context.get('flat_type', 'HDB flat')}, {context.get('neighborhood', 'Singapore')}")

        behaviour_block = "\n".join(behaviour_lines) if behaviour_lines else "No detailed data available."

        prompt = f"""You are Saivers, a Singapore home energy coach. Write a "Why this works for you specifically" explanation.

HOUSEHOLD: {context.get('name', 'Resident')}, {context.get('flat_type', 'HDB flat')}, {context.get('neighborhood', 'Singapore')}

THEIR ACTUAL BEHAVIOUR:
{behaviour_block}

SINGAPORE CONTEXT (March 2026):
- Season: {context.get('singapore_season', 'Transitional weather')}
- {context.get('season_notes', '')}
- {context.get('neighborhood', 'Singapore')}: {context.get('neighborhood_notes', 'typical HDB estate')}
- Optimal sleep temperature: 25–26°C (National Sleep Foundation + NTU research on tropical climates)

RECOMMENDED ACTION: "{context.get('action_title', 'Adjust AC settings')}"
ESTIMATED SAVING: S${context.get('potential_saving_sgd', 0):.2f}/week

Write 3 short paragraphs in plain English:
1. What is happening RIGHT NOW based on their specific data (reference their actual numbers)
2. The science and Singapore-specific reasons why this action will work for their situation
3. A specific prediction: "If {context.get('name', 'you')} does this for the next 7 days..."

Rules:
- Feel like a knowledgeable friend, not a report
- Use their name ({context.get('name', 'Resident')}) naturally once or twice
- Reference their specific numbers from the data above
- Keep each paragraph to 2-3 sentences
- No bullet points, no headers, just flowing text"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a warm, knowledgeable Singapore energy coach. Be specific, human, and practical. Reference real data. No markdown."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=400,
            temperature=0.5,
        )

        explanation = response.choices[0].message.content.strip()
        return {"explanation": explanation, "factors": factors}

    except Exception as e:
        # Fallback to static why_body if AI fails
        return {
            "explanation": context.get("why_body", "This action is one of the most effective ways to reduce your electricity bill based on your current usage patterns."),
            "factors": [],
        }


def generate_chat_response(household_context: dict, user_message: str) -> str:
    """Generate a conversational response for the coach chat endpoint."""
    try:
        client = get_openai_client()
        system = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Household context:\n"
            f"- Name: {household_context.get('name', 'Resident')}\n"
            f"- Flat: {household_context.get('flat_type', '4-room HDB')}, Punggol\n"
            f"- This week: {household_context.get('this_week_kwh', 'N/A')} kWh\n"
            f"- vs last week: {household_context.get('change_pct', 0)}% change\n"
            f"- Active anomalies: {household_context.get('anomaly_summary', 'none detected')}"
        )
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_message},
            ],
            max_tokens=250,
            temperature=0.4,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return "I can see your energy data. Your air-conditioner appears to be your main driver of usage. Try setting it to turn off automatically at 2am — this could save you S$5–8 a month."
