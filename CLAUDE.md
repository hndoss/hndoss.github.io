# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `/mnt/shared/development/CLAUDE.md` for global development guidelines.

## Project Overview

Personal blog (codewizardly.com) built with Jekyll using the Jekflix template. Hosted on GitHub Pages.

## Development Commands

```bash
# Docker Compose (recommended) - runs on localhost:4000 with livereload on :35729
docker compose up

# Native Ruby
bundle install
bundle exec jekyll serve
```

Development uses `_config.yml` + `_config_dev.yml` (overrides URL to localhost:4000).

## Architecture

### Layout Hierarchy

```
compress.html (HTML minification)
  └── base.html (HTML shell, header, footer)
        └── sidebar.html (adds left sidebar)
        │     └── page.html (static pages: about, contact)
        │     └── post.html (blog posts)
        │     └── category.html (category listings)
        │     └── contact.html (contact form)
        └── home.html (homepage with hero)
        └── minimal.html (no-sidebar layouts)
```

### Terminal Navigation System

The site uses a custom terminal/shell-style navigation:

1. **`assets/js/navigation.json`** - Liquid template that generates JSON with all categories and posts at build time
2. **`assets/js/terminal-nav.js`** - Interactive shell supporting `cd`, `ls`, `cat` commands with fuzzy search (uses Fuse.js)
3. **`_includes/sidebar-left.html`** - Tree-style category listing (`tree ~/blog`) and recent posts (`top -posts`)

Commands: `cd <category|post>`, `ls [category]`, `cat <post>`, Tab for autocomplete, arrow keys for navigation.

### SCSS Organization

`_sass/main.scss` imports all partials. Key files:
- `_variables.scss`, `_theme.scss` - Colors, fonts, breakpoints
- `_layout.scss` - Grid and sidebar layout
- `_components.scss` - Terminal panels, forms
- `_post.scss`, `_home.scss` - Page-specific styles

## Blog Post Format

```yaml
---
layout: post
title: "Post Title"
description: "Brief description"
date: YYYY-MM-DD HH:MM:SS
image: '/assets/img/path/to/image.jpg'
tags: [tag1, tag2]
---
```

Posts go in `_posts/YYYY/` organized by year. Categories are defined in `category/` directory. Use `--page-break--` for content pagination within posts.

## Key Configuration

`_config.yml` settings:
- `show_hero: true` - Homepage hero section
- `show_modal_on_exit: true` - Newsletter modal
- `two_columns_layout: false` - Post grid style
- `paginate_content.separator: "--page-break--"` - Multi-page posts

## Content Workflow

Two workflows documented in `docs/plans/2026-02-22-content-workflow-design.md`:

### Content Creation (blog posts)

```
Obsidian (ideation) → GitHub Issue (commitment) → Branch + PR (writing) → Merge (publish)
```

- Branch naming: `content/<issue-number>-<slug>`
- Scaffold with: `./scripts/new-post.sh <issue-number>` or `/new-post` command
- Posts go directly in `_posts/YYYY/` on the branch
- PR body includes `Closes #<issue-number>`
- Project board stages: Idea, Outline, Draft, Review, Published

### KTLO (maintenance)

```
GitHub Issue → Feature branch → Tasks → Single PR → Merge
```

- Branch naming: `fix/<issue-number>-<slug>` or `feat/<issue-number>-<slug>`
- Issue templates: use "Blog Post Idea" for content, "Maintenance Task" for KTLO
