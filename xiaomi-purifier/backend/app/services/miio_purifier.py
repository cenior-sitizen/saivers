"""
miIO / MIoT local provider for Xiaomi Air Purifier (zhimi.airp.cpa4).

zhimi.airp.cpa4 / xiaomi.airp.cpa4 use MIoT protocol, not classic miIO.
We use MiotDevice with set_properties (siid=2, piid=1 for power).

Required: pip install python-miio (or uv add python-miio)
Env: XIAOMI_PURIFIER_IP, XIAOMI_PURIFIER_TOKEN
Optional: XIAOMI_PURIFIER_MODEL (default zhimi.airp.cpa4)
"""

from __future__ import annotations

# zhimi.airp.cpa4 / xiaomi.airp.cpa4 power: siid=2, piid=1 (MIoT spec)
CPA4_POWER_MAPPING = {"power": {"siid": 2, "piid": 1}}

MIOT_MODELS = {"zhimi.airp.cpa4", "xiaomi.airp.cpa4"}


def turn_on_purifier(ip: str, token: str, model: str = "zhimi.airp.cpa4") -> None:
    """Turn on the air purifier. Raises on failure."""
    _run_power_command(ip=ip, token=token, model=model, on=True)


def turn_off_purifier(ip: str, token: str, model: str = "zhimi.airp.cpa4") -> None:
    """Turn off the air purifier. Raises on failure."""
    _run_power_command(ip=ip, token=token, model=model, on=False)


def _run_power_command(ip: str, token: str, model: str, on: bool) -> None:
    """
    Use MIoT for zhimi.airp.cpa4 / xiaomi.airp.cpa4 (set_properties).
    Classic miIO set_power does NOT work for these models.
    """
    try:
        from miio import Device
    except ImportError as err:
        raise RuntimeError(
            "python-miio not installed. Run: uv add python-miio"
        ) from err

    # zhimi.airp.cpa4 uses MIoT — use AirPurifierMiot with CPA4 mapping
    if model in MIOT_MODELS:
        _run_miot_power(ip=ip, token=token, model=model, on=on)
        return

    # Classic miIO models: try AirPurifier first, then raw set_power
    if model in _get_airpurifier_models():
        from miio.integrations.zhimi.airpurifier.airpurifier import AirPurifier
        purifier = AirPurifier(ip=ip, token=token, model=model, timeout=5)
        if on:
            purifier.on()
        else:
            purifier.off()
        return

    device = Device(ip=ip, token=token, model=model, timeout=5)
    try:
        device.send("set_power", ["on" if on else "off"])
    except Exception as e1:
        try:
            device.send("set_power", [1 if on else 0])
        except Exception as e2:
            raise RuntimeError(
                f"miIO command failed. set_power(on/off): {e1}; set_power(0/1): {e2}. "
                "Ensure device is on same network, token is correct."
            ) from e2


def _run_miot_power(ip: str, token: str, model: str, on: bool) -> None:
    """Use MIoT set_properties for zhimi.airp.cpa4. Power = siid 2, piid 1."""
    from miio import MiotDevice

    device = MiotDevice(
        ip=ip,
        token=token,
        model=model,
        mapping=CPA4_POWER_MAPPING,
        timeout=5,
    )
    device.set_property("power", on)


def _get_airpurifier_models() -> set[str]:
    """Get supported AirPurifier models from python-miio."""
    try:
        from miio.integrations.zhimi.airpurifier.airpurifier import AirPurifier
        return set(AirPurifier.supported_models)
    except Exception:
        return set()
