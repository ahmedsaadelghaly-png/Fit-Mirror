#!/bin/bash
# Installs Anny outside the project and exports the adult body meshes.
# Usage, from the project folder: bash scripts/export_adult_body_meshes.sh
set -euo pipefail
WORK=/var/tmp/fitmirror-body
export UV_CACHE_DIR=/var/tmp/fitmirror-vton/uvcache
mkdir -p "$WORK"
[ -x "$WORK/venv/bin/python" ] || uv venv --python 3.12 "$WORK/venv"
# The minimal install: the [smpl] extra is non-commercial.
uv pip install --python "$WORK/venv/bin/python" anny
"$WORK/venv/bin/python" scripts/export_adult_body_meshes.py "$WORK/meshes" 2>&1 | tee "$WORK/run.log"
echo "Done. Meshes are in $WORK/meshes"
