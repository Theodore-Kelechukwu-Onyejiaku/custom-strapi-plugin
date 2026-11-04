# Screenshot shot list

Save each file in this folder under the exact name below. The post already references them.

Setup before shooting:
- Light theme, browser at 1440 × 900, zoom 100%.
- Seed 6–8 published Blog entries with realistic titles, a few already published to one or two platforms, so the status icons show a mix.
- Dev.to and Bluesky keys set, LinkedIn connected. Leave Medium **Missing** for the credentials shot.
- Crop to the content area. Leave the left nav in only for the hero (01).

| # | File | Where | What must be visible |
| --- | --- | --- | --- |
| 01 | `screenshot-01-hero.png` | Plugin page | Publishing table with the chat window open bottom-right, answering "Which posts are not on Dev.to yet?" |
| 02 | `screenshot-02-admin-token.png` | Settings → Admin Tokens → edit | Content Manager *read* ticked for Blog and Tag, Plugins → Content Publisher → "Access the publishing table" ticked. **Hide the token value.** |
| 03 | `screenshot-03-claude-code-mcp.png` | Terminal, Claude Code `/mcp` | `strapi-docs` and `strapi` both connected, with the `content_publisher_*` tools listed |
| 04 | `screenshot-04-settings-collection-types.png` | Publishing settings | "Collection types" card with Blog and Article selected |
| 05 | `screenshot-05-settings-mapping.png` | Publishing settings → Dev.to open | Mapping dropdowns for Blog, including `tags` and its second "Tag field" dropdown |
| 06 | `screenshot-06-credentials-test.png` | Publishing settings → Dev.to | "Set in .env" badge and the green "Connected as @…" notification after Test connection |
| 07 | `screenshot-07-linkedin-connected.png` | Publishing settings → LinkedIn | Account name, expiry date, Test connection / Reconnect / Disconnect |
| 08 | `screenshot-08-publishing-table.png` | Plugin page | "Publish (n)" menu open on one row, showing remaining platforms and "Everywhere remaining" |
| 09 | `screenshot-09-content-manager-panel.png` | Content Manager → a Blog entry | Right-hand panel "Publish to" menu open, one platform as "View on …" |
| 10 | `screenshot-10-rbac-roles.png` | Settings → Roles → Editor | Content Publisher section expanded, only "Access the publishing table" ticked |
| 11 | `screenshot-11-chat-empty.png` | Chat window | Greeting and the four starter questions |
| 12 | `screenshot-12-chat-approval.png` | Chat window | "Publish my newest post to Bluesky", ✓ Looked up posts, ✓ Checked platforms, yellow approval card |
| 13 | `screenshot-13-chat-published.png` | Chat window | Same conversation after clicking Publish: "✓ Published · bluesky" and the reply with the live link |
| 14 | `screenshot-14-chat-table-answer.png` | Chat window | A reply rendered as a Markdown table |
| 15 | `screenshot-15-deployed-settings.png` | Deployed instance → Publishing settings | Every platform collapsed, none showing "Missing" |

Optional extras if there's room:
- The published Bluesky post itself, showing the link card.
- The Dev.to article, showing the cover image and canonical URL.
- The chat explaining a missing `STRAPI_MCP_TOKEN` permission.

Diagrams (`diagram-*.png`) are done. Edit the `.svg` and re-export with
`rsvg-convert -w 1600 diagram-x.svg -o diagram-x.png`.
