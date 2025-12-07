#!/usr/bin/env bash
set -euo pipefail

# Build script for qBits browser extension
# Creates separate zip files for Chrome and Firefox
# Usage: ./build.sh [chrome|firefox|all|release]
#   chrome  - Build Chrome extension only
#   firefox - Build Firefox extension only
#   all     - Build both extensions (default)
#   release [major|minor|patch] - Increment version, build, tag, and push to trigger GitHub release

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_ROOT/dist"
OUTPUT_DIR="$PROJECT_ROOT/build"
MANIFEST_FILE="$PROJECT_ROOT/public/manifest.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    jq -r '.version' "$MANIFEST_FILE"
}

# Increment version number
# Usage: increment_version [major|minor|patch]
increment_version() {
    local bump_type="${1:-patch}"
    local current_version
    current_version=$(get_version)
    
    # Parse version components
    local major minor patch
    IFS='.' read -r major minor patch <<< "$current_version"
    
    case "$bump_type" in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            log_error "Invalid bump type: $bump_type (use major, minor, or patch)"
            exit 1
            ;;
    esac
    
    local new_version="${major}.${minor}.${patch}"
    
    # Update manifest.json
    log_info "Updating version: $current_version -> $new_version"
    jq --arg v "$new_version" '.version = $v' "$MANIFEST_FILE" > "$MANIFEST_FILE.tmp"
    mv "$MANIFEST_FILE.tmp" "$MANIFEST_FILE"
    
    echo "$new_version"
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

# Create a release: increment version, build, commit, tag, and push
do_release() {
    local bump_type="${1:-patch}"
    
    log_info "Starting release process..."
    echo ""
    
    # Check for uncommitted changes (excluding the manifest we're about to change)
    cd "$PROJECT_ROOT"
    if ! git diff --quiet HEAD -- . ':!public/manifest.json' 2>/dev/null; then
        log_error "You have uncommitted changes. Please commit or stash them before releasing."
        exit 1
    fi
    
    # Increment version
    local new_version
    new_version=$(increment_version "$bump_type")
    
    # Build both extensions
    build_extension
    prepare_output
    build_chrome "$new_version"
    build_firefox "$new_version"
    
    # Git operations
    log_info "Committing version bump..."
    git add "$MANIFEST_FILE"
    git commit -m "chore: bump version to $new_version"
    
    log_info "Creating tag v$new_version..."
    git tag -a "v$new_version" -m "Release v$new_version"
    
    echo ""
    log_info "${BLUE}Release v$new_version prepared!${NC}"
    echo ""
    echo "To publish the release, run:"
    echo -e "  ${GREEN}git push && git push --tags${NC}"
    echo ""
    echo "This will trigger the GitHub Actions workflow to create a release"
    echo "with the Chrome and Firefox extension zips as downloadable assets."
}

# Main
main() {
    local target="${1:-all}"
    local bump_type="${2:-patch}"
    
    log_info "qBits Extension Build Script"
    echo ""
    
    check_dependencies
    
    # Handle release separately
    if [ "$target" = "release" ]; then
        do_release "$bump_type"
        exit 0
    fi
    
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
            echo "Usage: $0 [chrome|firefox|all|release]"
            echo ""
            echo "Commands:"
            echo "  chrome              Build Chrome extension only"
            echo "  firefox             Build Firefox extension only"
            echo "  all                 Build both extensions (default)"
            echo "  release [type]      Increment version, build, tag, and prepare for release"
            echo ""
            echo "Release types:"
            echo "  patch               Increment patch version (default): 1.0.0 -> 1.0.1"
            echo "  minor               Increment minor version: 1.0.0 -> 1.1.0"
            echo "  major               Increment major version: 1.0.0 -> 2.0.0"
            exit 1
            ;;
    esac
    
    echo ""
    log_info "Build complete! Output files in: $OUTPUT_DIR"
    ls -la "$OUTPUT_DIR"/*.zip 2>/dev/null || true
}

main "$@"
