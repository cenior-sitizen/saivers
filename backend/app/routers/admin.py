"""Admin analytics endpoints — Punggol region view."""

from fastapi import APIRouter, HTTPException

router = APIRouter()


def _get_client():
    try:
        from app.db.client import get_client
        return get_client()
    except Exception:
        return None


@router.get("/region-summary")
def region_summary(neighborhood: str = "punggol", days: int = 7):
    client = _get_client()
    if client is None:
        return {"error": "ClickHouse not connected", "neighborhood": neighborhood}
    try:
        result = client.query(
            """
            SELECT
                neighborhood_id,
                count(DISTINCT household_id)   AS households,
                round(sum(kwh), 2)             AS total_kwh,
                round(sum(cost_sgd), 2)        AS total_cost_sgd,
                round(sum(carbon_kg), 2)       AS total_carbon_kg
            FROM sp_energy_intervals
            WHERE neighborhood_id = {n:String}
              AND interval_date >= today() - {d:UInt8}
            GROUP BY neighborhood_id
            """,
            parameters={"n": neighborhood, "d": days},
        )
        rows = result.named_results()
        return rows[0] if rows else {"neighborhood": neighborhood, "households": 0}
    except Exception as e:
        return {"error": str(e)}


@router.get("/peak-heatmap")
def peak_heatmap(neighborhood: str = "punggol", days: int = 7):
    client = _get_client()
    if client is None:
        return {"error": "ClickHouse not connected"}
    try:
        result = client.query(
            """
            SELECT interval_date, slot_idx,
                round(sumMerge(total_kwh), 2)  AS kwh,
                uniqMerge(active_homes)         AS homes
            FROM neighborhood_rollup
            WHERE neighborhood_id = {n:String}
              AND interval_date >= today() - {d:UInt8}
            GROUP BY interval_date, slot_idx
            ORDER BY interval_date, slot_idx
            """,
            parameters={"n": neighborhood, "d": days},
        )
        return result.named_results()
    except Exception as e:
        return {"error": str(e)}


@router.get("/grid-contribution")
def grid_contribution(neighborhood: str = "punggol"):
    client = _get_client()
    if client is None:
        return {"error": "ClickHouse not connected"}
    try:
        result = client.query(
            """
            SELECT
                household_id,
                sumIf(kwh, interval_date >= today()-7)               AS this_week_kwh,
                sumIf(kwh, interval_date BETWEEN today()-35 AND today()-8) / 4 AS baseline_week_kwh
            FROM sp_energy_intervals
            WHERE neighborhood_id = {n:String}
            GROUP BY household_id
            """,
            parameters={"n": neighborhood},
        )
        rows = result.named_results()
        total_saved = sum(
            max(0, float(r["baseline_week_kwh"]) - float(r["this_week_kwh"]))
            for r in rows
        )
        return {
            "neighborhood": neighborhood,
            "total_kwh_saved": round(total_saved, 2),
            "total_sgd_saved": round(total_saved * 0.2911, 2),
            "total_co2_saved": round(total_saved * 0.402, 2),
            "per_household": [
                {
                    "household_id": r["household_id"],
                    "this_week_kwh": round(float(r["this_week_kwh"]), 2),
                    "baseline_kwh": round(float(r["baseline_week_kwh"]), 2),
                    "kwh_saved": round(max(0, float(r["baseline_week_kwh"]) - float(r["this_week_kwh"])), 2),
                }
                for r in rows
            ],
        }
    except Exception as e:
        return {"error": str(e)}


@router.get("/households")
def list_households():
    from app.data.households import HOUSEHOLDS
    client = _get_client()
    if client is None:
        return [{"household_id": h["household_id"], "name": h["name"], "flat_type": h["flat_type"]} for h in HOUSEHOLDS]
    try:
        result = client.query(
            """
            SELECT
                household_id,
                sumIf(kwh, interval_date = today())            AS today_kwh,
                count()                                        AS total_rows
            FROM sp_energy_intervals
            WHERE neighborhood_id = 'punggol'
            GROUP BY household_id
            """
        )
        kwh_map = {r["household_id"]: float(r["today_kwh"]) for r in result.named_results()}
        from app.data.households import HOUSEHOLD_MAP
        return [
            {
                **h,
                "today_kwh": kwh_map.get(h["household_id"], 0.0),
            }
            for h in HOUSEHOLDS
        ]
    except Exception as e:
        return {"error": str(e)}
