# Twin3 Brand Accessibility Review

## Scope

The logo-led Twin3 system uses **deep forest green** surfaces with **warm ivory** primary text and controls. The review covers the marketing landing page, X-enabled sign-in page, dashboard shell, and the Outreach Agent, Conversation Agent, Reply & Content Agent, Lead Intelligence, and Safety & Controls workspaces.

## Contrast and state checks

| Surface or state | Verified treatment |
| --- | --- |
| Primary text on forest surfaces | Warm ivory `--foreground` is paired with the darkest forest backgrounds. |
| Cards, tables, and empty states | Card text uses the foreground or muted-foreground token; borders remain visible without conveying information alone. |
| Primary actions | Warm-ivory action surfaces use the dark forest `--primary-foreground` text token. |
| Secondary actions and badges | Borders, fills, and text remain differentiated with an accompanying label or icon rather than color alone. |
| Inputs and selects | Forest-tinted input fills retain high-contrast light text and a warm-ivory focus boundary. |
| Status and safety states | Status labels stay textual (for example, “Connected” and “Not connected”) and do not rely on color alone. |

## Keyboard-focus behavior

The global stylesheet applies a visible warm-ivory `:focus-visible` outline and soft outer halo to links, buttons, inputs, textareas, selects, and custom button roles. The outline is offset from the component edge so it remains visible on dark cards, table controls, and light primary buttons. This treatment applies consistently to public and authenticated interfaces without displaying focus decoration for pointer-only interaction.

## Responsive visual QA

Desktop and mobile review targets include the landing page, sign-in page, dashboard, and representative agent workspaces. The shared tokens, global focus treatment, responsive navigation, action controls, cards, badges, and inputs were reviewed after applying the brand refresh.
