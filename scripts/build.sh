#!/usr/bin/env bash
set -euo pipefail

# Build script for qBits browser extension
# Creates separate zip files for Chrome and Firefox

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_ROOT/dist"
OUTPUT_DIR="$PROJECT_ROOT/build"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check for required tools
check_dependencies() {
    local missing=()
    
    if ! command -v jq &> /dev/null; then
        missing+=("jq")
    fi
    
    if ! command -v zip &> /dev/null; then
        missing+=("zip")
    fi
    
    if ! command -v bun &> /dev/null && ! command -v npm &> /dev/null; then
        missing+=("bun or npm")
    fi
    
    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing[*]}"
        exit 1
    fi
}

# Get version from manifest
get_version() {
    jq -r '.version' "$PROJECT_ROOT/public/manifest.json"
}

# Build the extension
build_extension() {
    log_info "Building extension..."
    cd "$PROJECT_ROOT"
    
    if command -v bun &> /dev/null; then
        bun run build
    else
        npm run build
    fi
}

# Create output directory
prepare_output() {
    log_info "Preparing output directory..."
    mkdir -p "$OUTPUT_DIR"
    
    # Copy assets to dist
    cp "$PROJECT_ROOT"/public/*.png "$DIST_DIR/" 2>/dev/null || true
}

# Build Chrome extension
build_chrome() {
    local version="$1"
    local zip_name="qbits-chrome-v${version}.zip"
    
    log_info "Building Chrome extension..."
    
    # Create Chrome-specific manifest (uses service_worker)
    jq '
        del(.browser_specific_settings) |
        .background = {"service_worker": "background.js", "type": "module"}
    ' "$PROJECT_ROOT/public/manifest.json" > "$DIST_DIR/manifest.json"
    
    # Create zip
    cd "$DIST_DIR"
    zip -r "$OUTPUT_DIR/$zip_name" . -q
    
    log_info "Created: $OUTPUT_DIR/$zip_name"
}

# Build Firefox extension
build_firefox() {
    local version="$1"
    local zip_name="qbits-firefox-v${version}.zip"
    
    log_info "Building Firefox extension..."
    
    # Create Firefox-specific manifest (uses scripts array, keeps browser_specific_settings)
    jq '
        .background = {"scripts": ["background.js"], "type": "module"}
    ' "$PROJECT_ROOT/public/manifest.json" > "$DIST_DIR/manifest.json"
    
    # Create zip
    cd "$DIST_DIR"
    zip -r "$OUTPUT_DIR/$zip_name" . -q
    
    log_info "Created: $OUTPUT_DIR/$zip_name"
}

# Main
main() {
    local target="${1:-all}"
    
    log_info "qBits Extension Build Script"
    echo ""
    
    check_dependencies
    
    local version
    version=$(get_version)
    log_info "Version: $version"
    
    build_extension
    prepare_output
    
    case "$target" in
        chrome)
            build_chrome "$version"
            ;;
        firefox)
            build_firefox "$version"
            ;;
        all)
            build_chrome "$version"
            build_firefox "$version"
            ;;
        *)
            log_error "Unknown target: $target"
            echo "Usage: $0 [chrome|firefox|all]"
            exit 1
            ;;
    esac
    
    echo ""
    log_info "Build complete! Output files in: $OUTPUT_DIR"
    ls -la "$OUTPUT_DIR"/*.zip 2>/dev/null || true
}

main "$@"
