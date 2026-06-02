#!/bin/bash
set -euo pipefail
cd /Users/mac/english-ai-tutor
exec /usr/bin/python3 -m http.server 8765
