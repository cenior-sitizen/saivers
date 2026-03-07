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
