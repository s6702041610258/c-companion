"""Limit the bundled Hermes gateway to answering C Companion requests."""

import os
import tempfile
from pathlib import Path

import yaml


path = Path("/opt/data/config.yaml")
if not path.is_file():
    raise SystemExit("Hermes has no model configuration. Run the model chooser first.")

config = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
model = config.get("model") or {}
if not isinstance(model, dict) or model.get("provider") in (None, "auto") or not (
    model.get("default") or model.get("model")
):
    raise SystemExit("Choose an AI provider and model before starting C Companion.")

config.setdefault("platform_toolsets", {})["api_server"] = []
config.setdefault("memory", {}).update(
    memory_enabled=False, user_profile_enabled=False, nudge_interval=0
)
config.setdefault("skills", {})["creation_nudge_interval"] = 0
config.setdefault("agent", {}).update(max_turns=2, gateway_timeout=100)
config.setdefault("compression", {})["enabled"] = False
config["mcp_servers"] = {}
config["fallback_model"] = []

with tempfile.NamedTemporaryFile(
    mode="w", encoding="utf-8", dir=path.parent, prefix="config.", delete=False
) as temporary:
    yaml.safe_dump(config, temporary, allow_unicode=True, sort_keys=False)
    temporary_path = Path(temporary.name)
os.chmod(temporary_path, 0o600)
os.replace(temporary_path, path)
print("Hermes model saved; tools and memory disabled for the tutor API.")
