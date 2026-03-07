"""OpenAI GPT-4o client for generating plain-language energy insights."""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


@lru_cache(maxsize=1)
def get_openai_client():
    from openai import OpenAI
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set in .env")
    return OpenAI(api_key=api_key)


SYSTEM_PROMPT = """You are WattCoach, a Singapore household energy coach.
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
