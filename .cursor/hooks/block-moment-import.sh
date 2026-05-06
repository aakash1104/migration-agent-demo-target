#!/bin/bash
set -euo pipefail

payload="$(cat)"
file_path="$(printf "%s" "$payload" | python3 -c 'import json,sys; data=json.load(sys.stdin); print(data.get("toolCall",{}).get("input",{}).get("target_file",""))')"

if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
  exit 0
fi

if rg -n "migration-allow-moment:" "$file_path" >/dev/null 2>&1; then
  exit 0
fi

if rg -n "from ['\"]moment(-timezone)?['\"]|require\(['\"]moment(-timezone)?['\"]\)" "$file_path" >/dev/null 2>&1; then
  echo "{\"permission\":\"deny\",\"message\":\"Blocked by migration policy: do not add new moment imports. Use date-fns/date-fns-tz or add // migration-allow-moment: <reason>.\"}"
  exit 2
fi

exit 0
