#!/usr/bin/env bash
# RPG Maker MZ on Linux (Proton)
#   ./rpgmz-launch.sh              — editor
#   ./rpgmz-launch.sh playtest     — game test (nw.exe)
#   ./rpgmz-launch.sh playtest .   — game test (this project dir)

set -uo pipefail

STEAM_COMPAT_DATA_PATH="${STEAM_COMPAT_DATA_PATH:-$HOME/.local/share/Steam/steamapps/compatdata/3686529573}"
STEAM_COMPAT_CLIENT_INSTALL_PATH="${STEAM_COMPAT_CLIENT_INSTALL_PATH:-$HOME/.local/share/Steam}"
PROTON_DIR="$STEAM_COMPAT_CLIENT_INSTALL_PATH/steamapps/common/Proton - Experimental"
NW_DIR='C:\Program Files\KADOKAWA\RPGMZ\nwjs-win'
NW_EXE="$NW_DIR\\nw.exe"
EDITOR_EXE='C:\Program Files\KADOKAWA\RPGMZ\RPGMZ.exe'
DEFAULT_PROJECT='C:\users\steamuser\Documents\RMMZ\deneme'
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

export STEAM_COMPAT_DATA_PATH STEAM_COMPAT_CLIENT_INSTALL_PATH
export DISPLAY="${DISPLAY:-:0}"
export XAUTHORITY="${XAUTHORITY:-$HOME/.Xauthority}"
export SDL_VIDEODRIVER=x11
# Avoid Steam client assertions in child Wine processes (non-Steam shortcut)
export SteamAppId=480
export SteamGameId=480

# Optional GPU tweaks (can crash nw.exe on some setups — off by default)
setup_gpu_env() {
    if [[ "${RPGMZ_GPU:-0}" != "1" ]]; then
        return
    fi
    export __GLX_VENDOR_LIBRARY_NAME=mesa
    export MESA_LOADER_DRIVER_OVERRIDE="${MESA_LOADER_DRIVER_OVERRIDE:-radeonsi}"
}

PLAYTEST_LOG="$SCRIPT_DIR/playtest-launch.log"
log_playtest() {
    printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$PLAYTEST_LOG"
}

# Temporarily patch chromium-args for diagnostics (restored on exit)
_CHROMIUM_ARGS_BACKUP=""
apply_chromium_profile() {
    local profile="${RPGMZ_GL:-default}"
    _CHROMIUM_ARGS_BACKUP="$(sed -n 's/.*"chromium-args": "\([^"]*\)".*/\1/p' "$SCRIPT_DIR/package.json" | head -1)"
    case "$profile" in
        angle)
            _set_chromium_args "--force-color-profile=srgb --ignore-gpu-blocklist --use-gl=angle --use-angle=gl"
            ;;
        debug)
            _set_chromium_args "--force-color-profile=srgb --remote-debugging-port=9222"
            ;;
        *)
            _set_chromium_args "--force-color-profile=srgb"
            ;;
    esac
}

_set_chromium_args() {
    local args="$1"
    if command -v python3 >/dev/null 2>&1; then
        python3 - "$SCRIPT_DIR/package.json" "$args" <<'PY'
import json, sys
path, args = sys.argv[1], sys.argv[2]
with open(path, encoding="utf-8") as f:
    data = json.load(f)
data["chromium-args"] = args
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=4)
    f.write("\n")
PY
    else
        local esc="${args//\\/\\\\}"
        esc="${esc//\"/\\\"}"
        sed -i "s|\"chromium-args\": \".*\"|\"chromium-args\": \"$esc\"|" "$SCRIPT_DIR/package.json"
    fi
}

restore_chromium_profile() {
    if [[ -n "$_CHROMIUM_ARGS_BACKUP" ]]; then
        _set_chromium_args "$_CHROMIUM_ARGS_BACKUP"
    fi
}

setup_fontconfig() {
    mkdir -p /tmp/rmmz-fontconfig-cache /tmp/rmmz-xdg-cache
    local fc_conf="/tmp/rmmz-minimal-fonts.conf"
    cat >"$fc_conf" <<EOF
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>$SCRIPT_DIR/fonts</dir>
  <dir>/usr/share/fonts</dir>
  <dir>/usr/share/fonts/TTF</dir>
  <dir>/usr/share/fonts/truetype</dir>
  <cachedir>/tmp/rmmz-fontconfig-cache</cachedir>
</fontconfig>
EOF
    export FONTCONFIG_FILE="$fc_conf"
    export FONTCONFIG_PATH="/usr/share/fonts:$SCRIPT_DIR/fonts"
    export XDG_CACHE_HOME="/tmp/rmmz-xdg-cache"
    export FONTCONFIG_USE_MMAP=0
}

ensure_plugins_js() {
    if grep -q 'var $plugins = \[\];' "$SCRIPT_DIR/js/plugins.js" 2>/dev/null; then
        if [[ -f "$SCRIPT_DIR/js/plugins.js.bak" ]]; then
            echo "Restoring js/plugins.js from js/plugins.js.bak (was empty from diagnostics)."
            cp "$SCRIPT_DIR/js/plugins.js.bak" "$SCRIPT_DIR/js/plugins.js"
        else
            echo "ERROR: js/plugins.js is empty. Restore it from the editor or git." >&2
            exit 1
        fi
    fi
}

# Same path that worked for RPGMZ.exe — direct proton, NOT SteamLinuxRuntime wrapper
# (wrapper caused x11drv display-fd failures for nw.exe / Chromium).
run_proton() {
    if [[ ! -x "$PROTON_DIR/proton" ]]; then
        echo "ERROR: Proton not found: $PROTON_DIR/proton" >&2
        return 127
    fi
    echo "Proton: starting..."
    "$PROTON_DIR/proton" run "$@"
}

win_path_for() {
    local linux_path
    linux_path="$(readlink -f "$1")"
    "$PROTON_DIR/proton" run winepath -w "$linux_path" 2>/dev/null | tr -d '\r'
}

_PLUGINS_SWAPPED=0
prepare_no_plugins() {
    if [[ "${RPGMZ_NO_PLUGINS:-0}" != "1" ]]; then
        return
    fi
    cp "$SCRIPT_DIR/js/plugins.js" "$SCRIPT_DIR/js/plugins.js.bak"
    printf '%s\n' '// temporary empty plugin list for diagnostics' 'var $plugins = [];' > "$SCRIPT_DIR/js/plugins.js"
    _PLUGINS_SWAPPED=1
    echo "Plugins disabled (will restore js/plugins.js on exit)"
}

restore_plugins_on_exit() {
    if [[ "$_PLUGINS_SWAPPED" == "1" ]] && [[ -f "$SCRIPT_DIR/js/plugins.js.bak" ]]; then
        mv -f "$SCRIPT_DIR/js/plugins.js.bak" "$SCRIPT_DIR/js/plugins.js"
    fi
}
trap 'restore_plugins_on_exit; restore_chromium_profile' EXIT

mode="${1:-editor}"
shift || true

case "$mode" in
    editor|edit)
        set -e
        run_proton "$EDITOR_EXE" "$@"
        ;;
    playtest|game|test)
        : >"$PLAYTEST_LOG"
        log_playtest "=== playtest start ==="
        setup_gpu_env
        setup_fontconfig
        ensure_plugins_js
        prepare_no_plugins
        if [[ "${RPGMZ_DEBUG:-0}" == "1" ]]; then
            export RPGMZ_GL=debug
        fi
        apply_chromium_profile
        if [[ -n "${1:-}" ]]; then
            PROJECT_WIN="$(win_path_for "$1")"
        else
            PROJECT_WIN="$DEFAULT_PROJECT"
        fi
        log_playtest "project=$PROJECT_WIN chromium-profile=${RPGMZ_GL:-default}"
        echo "Playtest project: $PROJECT_WIN"
        echo "Log file: $PLAYTEST_LOG"
        if [[ ! -e /etc/machine-id ]] && [[ -f /var/db/machine-id ]]; then
            echo "Note: /etc/machine-id missing — sudo ln -sf /var/db/machine-id /etc/machine-id"
        fi
        echo "Starting nw.exe (wait 10–30s on first run)..."
        if [[ "${RPGMZ_DEBUG:-0}" == "1" ]]; then
            echo "DevTools (while window open): http://localhost:9222"
        fi
        run_proton "$NW_EXE" "$PROJECT_WIN" 2>&1 | tee -a "$PLAYTEST_LOG"
        rc=${PIPESTATUS[0]}
        log_playtest "nw.exe exit code: $rc"
        if [[ -f "$SCRIPT_DIR/debug.log" ]]; then
            log_playtest "--- debug.log (last 15 lines) ---"
            tail -15 "$SCRIPT_DIR/debug.log" | tee -a "$PLAYTEST_LOG"
        fi
        if [[ "$rc" -ne 0 ]]; then
            echo "Playtest exited with code $rc — see $PLAYTEST_LOG" >&2
            exit "$rc"
        fi
        echo "Playtest finished (exit 0). If the window closed instantly, try: RPGMZ_GL=angle ./rpgmz-launch.sh playtest"
        ;;
    *)
        echo "Usage: $0 [editor|playtest [project_dir]]" >&2
        exit 1
        ;;
esac
