# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `/mnt/shared/development/CLAUDE.md` for global development guidelines.

## Project Overview

Personal blog (codewizardly.com) built with Jekyll using the Jekflix template. Hosted on GitHub Pages.

## Development Commands

```bash
# Docker Compose (recommended)
docker compose up

# Native Ruby
bundle install
bundle exec jekyll serve
```

## Architecture

### Jekyll Structure
- `_config.yml` - Main site configuration
- `_layouts/` - Page templates (post.html, home.html, category.html, etc.)
- `_includes/` - Reusable HTML components (header, footer, sidebar, etc.)
- `_sass/` - SCSS stylesheets (main.scss imports all partials)
- `_posts/YYYY/` - Blog posts organized by year
- `_authors/` - Author profile definitions
- `_site/` - Generated output (gitignored)

### Assets
- `assets/js/` - JavaScript files
  - `scripts.min.js` - Bundled main JS
  - `terminal-nav.js` - Terminal-style navigation component
  - `navigation.json` - Site navigation structure
- `assets/css/` - Compiled CSS
- `assets/img/` - Images

### Key Custom Components
- Terminal-style sidebar navigation (`_includes/sidebar-left.html`, `terminal-nav.js`)
- Terminal-style contact form (`_layouts/contact.html`, `terminal-contact.js`)

## Blog Post Format

Posts use front matter:
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

Categories are defined in `category/` directory with their own front matter.

## Plugins

- `jekyll-paginate` - Blog post pagination
- `jekyll-paginate-content` - Content pagination within posts
