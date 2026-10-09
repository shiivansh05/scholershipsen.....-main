# Design System

## Direction

Scholarship Sentinel is an investigator's instrument, used by government officers who need to trust what they see. The look is **calm, precise, and physical**: matte, faceted objects under soft studio light, set on a clean mineral-grey desk. Depth comes from real 3D and layered surfaces, not from gradients and glow.

The memorable moment is the **3D relationship graph**. Everything else stays quiet so that graph carries the demo.

## Hard rules

- **No violet, purple, indigo, fuchsia or magenta anywhere.** This includes shadows, focus rings, gradients, chart series and the 3D scene lighting. Override the Tailwind palette so these colors cannot be used by accident.
- No gradient text. No gradient wash backgrounds.
- No emoji as icons. Use one consistent line-icon set (Lucide), 1.5 px stroke.
- No Inter, Roboto or system-default look.
- No identical grid of equal rounded cards. Vary size and weight by importance.
- No all-caps eyebrow label above every heading. No "Welcome to" or marketing copy.
- No glassmorphism on every panel. Use it at most once (the graph legend).

## Color tokens

| Token | Hex | Use |
|---|---|---|
| mist | `#E6EDEF` | App background |
| paper | `#F6F9F9` | Panels, tables |
| ink | `#12262E` | Primary text |
| steel | `#6B8794` | Secondary text, borders |
| petrol | `#0F4C5C` | Primary actions, selection, links |
| harbor | `#0A2A33` | The 3D stage background and sidebar |
| signal | `#E0452B` | High risk only |
| amber | `#E8A02A` | Review required only |
| sea | `#2F9E8F` | Normal, resolved, success |

Risk colors are semantic. Do not use signal, amber or sea for decoration. Contrast: ink on mist and paper must meet WCAG AA; check signal text on paper (use a darker `#B8321B` for small text).

## Typography

| Role | Font | Notes |
|---|---|---|
| Display and headings | Bricolage Grotesque | 600 to 700, tight tracking, large sizes for key numbers |
| Body and UI | Public Sans | 400, 500, 600. Tabular numerals for IDs, scores, amounts |

Scale: 12 / 14 / 16 / 20 / 28 / 44. Body line length under 75 characters. Sentence case everywhere.

## Depth and 3D

### 1. Cluster graph (hero, cluster detail page)

Built with React Three Fiber and drei (or `react-force-graph-3d`).

- Stage: harbor background with a faint floor grid, soft key light plus rim light from the back, subtle fog for depth.
- Node shapes by type, so the graph reads without a legend:
  - Student: small sphere, steel
  - Bank account: large faceted octahedron, signal when shared
  - Mobile: cube, amber when shared
  - Institution: short cylinder, paper
  - Address: cone, steel
  - Document: flat slab, sea-grey
- Edges: thin tubes, thicker toward the shared node. Edges into a flagged node tint toward signal.
- Flagged shared nodes get a soft emissive halo and slow pulse (the one always-on motion).
- Camera: slow auto-orbit until the user drags, then stop. Click a node to focus and show a detail panel. Reset view button.
- Labels: HTML overlays, shown for hovered or selected nodes, plus the shared nodes.
- Performance: cap at 200 nodes, use instanced meshes, pause rendering when the tab is hidden.

### 2. Institution map (overview page)

An isometric grid of extruded bars, one per flagged institution. Height equals applications relative to active students. Bars over the 3x threshold turn signal. Hover lifts the bar and shows a tooltip. Click opens the institution's clusters.

### 3. Surfaces

- Three elevation levels only: flat (table rows), raised (panels), floating (menus, dialogs).
- Shadows are soft, offset downward, and tinted with petrol at low opacity, never neutral grey and never violet.
- Selected cluster card tilts up to 3 degrees toward the pointer (CSS perspective) and lifts. Disable on touch and for reduced motion.
- The sidebar sits slightly above the page with a visible edge, like a physical rail.

## Layout

Left rail (harbor) with five items: Overview, Clusters, Institutions, Cases, Data. Content area on mist.

**Overview**
```
[ Headline numbers: Applications | Review | High risk ]   (one wide row, unequal widths)
[ 3D institution map (large, 60%) ][ Top clusters list (40%) ]
[ Recent officer activity ]
```

**Cluster detail**
```
[ CL-104  Risk 87 High   status   actions ]
[ 3D graph stage (about 60% width, full height) ][ Why this was flagged ]
[ Students table (masked) | Timeline of case actions ]
```

Left align text. Numbers right align in tables.

## Components

- **Risk meter:** a semicircular or linear gauge with the score, plus the line "Score reflects unusual signals, not the chance of fraud."
- **Why-flagged list:** each reason shows signal name, points, one plain sentence. Points add up visibly to the score.
- **Case actions:** Verify, Assign investigator, Request documents, Escalate, Close case. Primary action is petrol; Escalate is signal outline; Close is quiet.
- **Status chips:** Open, Assigned, Documents requested, Escalated, Closed. Same words in the toast after the action.
- **Tables:** dense, row height 44, sticky header, sortable, keyboard navigable.

## Motion

- One entrance: on first load of Overview, bars in the institution map rise in sequence over 600 ms.
- Responses to action only after that: dialogs, expanding rows, success toasts, graph focus.
- Respect `prefers-reduced-motion`: no orbit, no pulse, no rise-in; show the static scene.

## Copy

- Plain verbs, active voice. "Assign investigator", not "Submit".
- Empty state: "No clusters match these filters. Clear filters to see all 12."
- Errors say what happened and what to do. No apologies.
- Never use "fraudster", "guilty" or "criminal" for a student. Use "linked students", "flagged cluster", "requires verification".

## Quality floor

Responsive down to tablet (graph stacks above the reasons panel). On small screens the 3D scene falls back to a static image with an "Open interactive view" action. Visible keyboard focus in petrol. Colors never carry meaning alone: risk bands also show text labels.
