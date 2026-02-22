#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# new-post.sh - Scaffold a new blog post from a GitHub issue
#
# Usage: ./scripts/new-post.sh <issue-number>
#
# Creates:
#   - Git branch: content/<issue-number>-<slug>
#   - Post file:  _posts/YYYY/YYYY-MM-DD-<slug>.md
#   - Image dir:  assets/img/posts/<slug>/
# ============================================================================

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Valid blog categories (matching category/*.md files)
VALID_CATEGORIES=("devops" "code" "tutorial" "security" "life" "work")

# Labels to exclude from tags (these are organizational, not content tags)
PILLAR_LABELS=("content" "ai-devops" "cloud-native" "devsecops" "platform-eng" "linux")

# Default category when none detected from labels
DEFAULT_CATEGORY="devops"

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

die() {
    echo "ERROR: $*" >&2
    exit 1
}

check_dependency() {
    command -v "$1" >/dev/null 2>&1 || die "'$1' is required but not installed."
}

# Convert a title string into a URL-safe slug.
#   - Strips "[Content] " prefix
#   - Transliterates accented characters (e.g., e -> e)
#   - Lowercases
#   - Replaces non-alphanumeric characters (except hyphens) with hyphens
#   - Collapses consecutive hyphens
#   - Trims leading/trailing hyphens
slugify() {
    local title="$1"

    # Strip "[Content] " prefix (case-insensitive)
    title="${title#\[Content\] }"
    title="${title#\[content\] }"

    # Transliterate accented/unicode chars to ASCII, then slugify
    if command -v iconv >/dev/null 2>&1; then
        echo "$title" \
            | iconv -f UTF-8 -t ASCII//TRANSLIT 2>/dev/null \
            | tr '[:upper:]' '[:lower:]' \
            | sed 's/[^a-z0-9-]/-/g' \
            | sed 's/-\{2,\}/-/g' \
            | sed 's/^-//' \
            | sed 's/-$//'
    else
        # Fallback: strip non-ASCII bytes before slugifying
        echo "$title" \
            | LC_ALL=C tr -dc '[:print:]' \
            | tr '[:upper:]' '[:lower:]' \
            | sed 's/[^a-z0-9-]/-/g' \
            | sed 's/-\{2,\}/-/g' \
            | sed 's/^-//' \
            | sed 's/-$//'
    fi
}

# Check if a value exists in the VALID_CATEGORIES array
is_valid_category() {
    local val="$1"
    for cat in "${VALID_CATEGORIES[@]}"; do
        if [[ "$cat" == "$val" ]]; then
            return 0
        fi
    done
    return 1
}

# Check if a label is a pillar/organizational label (should be excluded from tags)
is_pillar_label() {
    local val="$1"
    for label in "${PILLAR_LABELS[@]}"; do
        if [[ "$label" == "$val" ]]; then
            return 0
        fi
    done
    return 1
}

# Extract a form field value from a GitHub issue body.
# GitHub issue forms render dropdown values as:
#   ### Field Name\n\nvalue\n\n### Next Field
extract_form_field() {
    local body="$1"
    local field="$2"
    echo "$body" | sed -n "/^### ${field}$/,/^### /{/^### /d;/^$/d;p;}" | head -1 | tr -d '[:space:]'
}

# --------------------------------------------------------------------------
# Argument validation
# --------------------------------------------------------------------------

if [[ $# -ne 1 ]]; then
    echo "Usage: $0 <issue-number>" >&2
    exit 1
fi

ISSUE_NUMBER="$1"

if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
    die "Issue number must be a positive integer, got: '$ISSUE_NUMBER'"
fi

# --------------------------------------------------------------------------
# Dependency checks
# --------------------------------------------------------------------------

check_dependency gh
check_dependency jq

# --------------------------------------------------------------------------
# Fetch issue metadata
# --------------------------------------------------------------------------

echo "Fetching issue #${ISSUE_NUMBER}..."

if ! ISSUE_JSON="$(gh issue view "$ISSUE_NUMBER" --json title,labels,body 2>&1)"; then
    die "Failed to fetch issue #${ISSUE_NUMBER}. Is the gh CLI authenticated and are you in the correct repo?
gh output: $ISSUE_JSON"
fi

ISSUE_TITLE="$(echo "$ISSUE_JSON" | jq -r '.title')"
LABELS_JSON="$(echo "$ISSUE_JSON" | jq -r '[.labels[].name]')"

if [[ -z "$ISSUE_TITLE" || "$ISSUE_TITLE" == "null" ]]; then
    die "Could not parse issue title from issue #${ISSUE_NUMBER}."
fi

# Strip "[Content] " prefix from title
CLEAN_TITLE="${ISSUE_TITLE#\[Content\] }"
CLEAN_TITLE="${CLEAN_TITLE#\[content\] }"

echo "  Title:  $CLEAN_TITLE"

# --------------------------------------------------------------------------
# Generate slug
# --------------------------------------------------------------------------

SLUG="$(slugify "$ISSUE_TITLE")"

if [[ -z "$SLUG" ]]; then
    die "Generated slug is empty. Check issue title: '$ISSUE_TITLE'"
fi

echo "  Slug:   $SLUG"

# --------------------------------------------------------------------------
# Parse category and pillar from issue body (GitHub form fields)
# --------------------------------------------------------------------------

ISSUE_BODY="$(echo "$ISSUE_JSON" | jq -r '.body // ""')"

CATEGORY="$DEFAULT_CATEGORY"

# Try to extract category from the issue body (set by the form dropdown)
BODY_CATEGORY="$(extract_form_field "$ISSUE_BODY" "Category")"
if [[ -n "$BODY_CATEGORY" ]] && is_valid_category "$BODY_CATEGORY"; then
    CATEGORY="$BODY_CATEGORY"
else
    # Fallback: scan labels for a valid category (for issues not created from template)
    mapfile -t LABELS < <(echo "$LABELS_JSON" | jq -r '.[]')
    for label in "${LABELS[@]}"; do
        if is_valid_category "$label"; then
            CATEGORY="$label"
            break
        fi
    done
fi

echo "  Category: $CATEGORY"

# --------------------------------------------------------------------------
# Detect pillar from issue body, collect tags from labels
# --------------------------------------------------------------------------

# Read labels into array if not already done
if [[ -z "${LABELS+x}" ]]; then
    mapfile -t LABELS < <(echo "$LABELS_JSON" | jq -r '.[]')
fi

# Try to extract pillar from the issue body
BODY_PILLAR="$(extract_form_field "$ISSUE_BODY" "Pillar")"

TAGS=()
for label in "${LABELS[@]}"; do
    if ! is_pillar_label "$label" && ! is_valid_category "$label"; then
        TAGS+=("$label")
    fi
done

# Add the pillar as a tag if detected from body and not already in tags
if [[ -n "$BODY_PILLAR" ]] && ! is_valid_category "$BODY_PILLAR"; then
    # Check it's not already in TAGS
    pillar_in_tags=false
    for tag in "${TAGS[@]}"; do
        if [[ "$tag" == "$BODY_PILLAR" ]]; then
            pillar_in_tags=true
            break
        fi
    done
    if [[ "$pillar_in_tags" == false ]]; then
        TAGS+=("$BODY_PILLAR")
    fi
fi

echo "  Tags:   ${TAGS[*]:-<none>}"

# --------------------------------------------------------------------------
# Derive dates and paths
# --------------------------------------------------------------------------

TODAY="$(date +%Y-%m-%d)"
YEAR="$(date +%Y)"

BRANCH_NAME="content/${ISSUE_NUMBER}-${SLUG}"
POST_DIR="${REPO_ROOT}/_posts/${YEAR}"
POST_FILE="${POST_DIR}/${TODAY}-${SLUG}.md"
IMAGE_DIR="${REPO_ROOT}/assets/img/posts/${SLUG}"

# --------------------------------------------------------------------------
# Safety checks
# --------------------------------------------------------------------------

if [[ -f "$POST_FILE" ]]; then
    die "Post file already exists: $POST_FILE"
fi

# Check for uncommitted changes that could complicate branching
if ! git -C "$REPO_ROOT" diff-index --quiet HEAD -- 2>/dev/null; then
    echo "WARNING: You have uncommitted changes. The new branch will include them." >&2
fi

# --------------------------------------------------------------------------
# Create git branch
# --------------------------------------------------------------------------

echo ""
echo "Creating branch: $BRANCH_NAME"
git -C "$REPO_ROOT" checkout -b "$BRANCH_NAME"

# --------------------------------------------------------------------------
# Create directories
# --------------------------------------------------------------------------

mkdir -p "$POST_DIR"
mkdir -p "$IMAGE_DIR"

# Add a .gitkeep so the empty image directory is tracked
touch "${IMAGE_DIR}/.gitkeep"

# --------------------------------------------------------------------------
# Generate frontmatter and post file
# --------------------------------------------------------------------------

# Build the tags YAML block
TAGS_YAML=""
if [[ ${#TAGS[@]} -gt 0 ]]; then
    TAGS_YAML="tags:"
    for tag in "${TAGS[@]}"; do
        TAGS_YAML="${TAGS_YAML}
  - ${tag}"
    done
else
    TAGS_YAML="tags: []"
fi

# Write the post file using a heredoc.
# Title is quoted to handle colons and special characters in YAML.
cat > "$POST_FILE" <<EOF
---
layout: post
title: "${CLEAN_TITLE}"
description:
image:
twitter_text:
date: ${TODAY} 00:00:00
category: ${CATEGORY}
${TAGS_YAML}
author: hector
paginate: true
---

<!-- TODO: Write post content for issue #${ISSUE_NUMBER} -->
EOF

# --------------------------------------------------------------------------
# Summary
# --------------------------------------------------------------------------

echo ""
echo "============================================"
echo "  Post scaffolding complete!"
echo "============================================"
echo ""
echo "  Branch:     $BRANCH_NAME"
echo "  Post file:  ${POST_FILE#"$REPO_ROOT"/}"
echo "  Image dir:  ${IMAGE_DIR#"$REPO_ROOT"/}"
echo ""
echo "Next steps:"
echo "  1. Edit the post file to add content"
echo "  2. Add a cover image to the image directory"
echo "  3. Update description, image, and twitter_text in frontmatter"
echo "  4. Run 'docker compose up' to preview locally"
echo "  5. Commit and push when ready"
echo ""
