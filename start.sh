#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v docker >/dev/null || ! docker info >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "เปิด Docker Desktop (หรือ Docker Engine + Compose) ก่อน แล้วรันไฟล์นี้อีกครั้ง" >&2
  exit 1
fi

choose_model=false
open_browser=true
rebuild=false
for argument in "$@"; do
  case "$argument" in
    --choose-model) choose_model=true ;;
    --no-browser) open_browser=false ;;
    --rebuild) rebuild=true ;;
    *) echo "ตัวเลือกไม่รู้จัก: $argument" >&2; exit 2 ;;
  esac
done

if [[ ! -f .env ]]; then
  if ! command -v openssl >/dev/null; then
    echo "ต้องมี openssl เพื่อสร้างกุญแจเชื่อม Hermes" >&2
    exit 1
  fi
  umask 077
  gateway_key="$(openssl rand -hex 32)"
  printf '%s\n' \
    'HERMES_BASE_URL=http://hermes:8642/v1' \
    "HERMES_API_KEY=$gateway_key" \
    'HERMES_MODEL=hermes-agent' \
    'BIND_ADDRESS=127.0.0.1' \
    'PORT=8091' > .env
  unset gateway_key
elif ! grep -Fxq 'HERMES_BASE_URL=http://hermes:8642/v1' .env; then
  echo "พบ .env ของการติดตั้งแบบเดิม กรุณาใช้โฟลเดอร์ใหม่สำหรับชุดที่รวม Hermes" >&2
  exit 1
fi

if [[ ! -f .setup-ready ]]; then choose_model=true; fi

echo "กำลังเตรียม Hermes ใน Docker (ครั้งแรกอาจใช้เวลาหลายนาที)..."
hermes_image='nousresearch/hermes-agent@sha256:fca358f12efd65bfaaca05884166f15c0e2788375ca30d77061ac1ebc96452b7'
if ! docker image inspect "$hermes_image" >/dev/null 2>&1; then docker compose pull hermes; fi

if [[ "$choose_model" == true ]]; then
  docker compose stop app monitor hermes >/dev/null 2>&1 || true
  echo "เลือกผู้ให้บริการ AI เข้าสู่ระบบหรือกรอก API key และเลือกโมเดลในขั้นตอน Hermes ที่กำลังเปิด"
  docker compose run --rm --no-deps hermes model
  docker compose run --rm --no-deps --user 10000:10000 \
    --entrypoint /opt/hermes/.venv/bin/python hermes /setup/harden_hermes.py
fi

echo "กำลังสร้างและเปิดหน้าเว็บ..."
app_version="$(sed -n 's/^[[:space:]]*"version":[[:space:]]*"\([^"]*\)".*/\1/p' package.json | head -n 1)"
if [[ -z "$app_version" ]]; then echo "อ่านรุ่นโปรแกรมจาก package.json ไม่ได้" >&2; exit 1; fi
if command -v git >/dev/null && git rev-parse --verify HEAD >/dev/null 2>&1 && git diff --quiet HEAD; then
  export SOURCE_REVISION="$(git rev-parse HEAD)"
fi
configured_image="$(sed -n 's/^APP_IMAGE=//p' .env | tail -n 1 | tr -d '\r')"
app_image="${configured_image:-c-companion:$app_version}"
if [[ "$rebuild" == true ]] || ! docker image inspect "$app_image" >/dev/null 2>&1; then
  docker compose build app
else
  echo "ใช้อิมเมจเว็บที่สร้างไว้แล้ว: $app_image"
fi
docker compose up -d --wait --remove-orphans

if ! docker compose exec -T app node -e '
const base=process.env.HERMES_BASE_URL.replace(/\/$/, "");
const headers={Authorization:"Bearer "+process.env.HERMES_API_KEY,"Content-Type":"application/json"};
const body={model:"hermes-agent",stream:false,max_tokens:32,messages:[{role:"user",content:"Reply with one short word."}]};
fetch(base+"/chat/completions",{method:"POST",headers,body:JSON.stringify(body),signal:AbortSignal.timeout(120000)})
 .then(async r=>{if(!r.ok)throw Error("Hermes returned "+r.status);const d=await r.json();if(d.hermes?.failed||d.choices?.[0]?.finish_reason==="error"||!d.choices?.[0]?.message?.content)throw Error(d.hermes?.error_code||"Model did not answer");console.log("Hermes และโมเดลตอบได้แล้ว");})
 .catch(e=>{console.error("ตรวจโมเดลไม่ผ่าน: "+e.message);process.exitCode=1});'; then
  echo "เว็บเปิดแล้ว แต่โมเดลยังตอบไม่ได้ ให้รัน bash start.sh --choose-model เพื่อตั้งค่าใหม่" >&2
  exit 1
fi

touch .setup-ready
listen_port="$(sed -n 's/^PORT=//p' .env | tail -n 1)"
listen_port="${listen_port:-8091}"
echo "พร้อมใช้งานที่ http://localhost:$listen_port"
if [[ "$open_browser" == true ]]; then
  if command -v open >/dev/null; then open "http://localhost:$listen_port"
  elif command -v xdg-open >/dev/null && [[ -n "${DISPLAY:-}" ]]; then xdg-open "http://localhost:$listen_port" >/dev/null 2>&1 || true
  fi
fi
