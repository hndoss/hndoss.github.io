---
description: Scaffold a new blog post from a GitHub issue
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# New Blog Post

Create a new blog post from a GitHub issue.

## Instructions

1. If no issue number was provided as argument ($ARGUMENTS), list open content issues:
   ```
   gh issue list --label content --state open
   ```
   Ask the user which issue to use.

2. Run the scaffolding script:
   ```
   ./scripts/new-post.sh <issue-number>
   ```

3. Read the created post file and the issue body.

4. Based on the issue outline, generate a suggested post structure with:
   - An engaging introduction (2-3 sentences)
   - Section headings derived from the outline points
   - Placeholder text for each section describing what to cover
   - A conclusion section

5. Write the suggested structure into the post file, preserving the frontmatter.

6. Ask the user if they want to:
   - Start writing (fill in sections interactively)
   - Adjust the structure
   - Preview locally with `docker compose up`
