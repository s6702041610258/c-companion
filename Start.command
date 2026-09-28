#!/usr/bin/env bash
cd "$(dirname "$0")"
bash ./start.sh
result=$?
if [[ $result -ne 0 ]]; then
  echo
  read -r -p "กด Enter เพื่อปิดหน้าต่างนี้..." _
fi
exit "$result"
