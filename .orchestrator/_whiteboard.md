# Iteration Whiteboard

**Change request:** go through and make view when on mobile screen, ehance user experience on mobile go through components

**Subtasks planned:** 3

1. **Designer**: Audit every page and component in the Drop app (landing, auth, dashboard, create-drop flow, drop detail, contributor pledge page, email preview, public share page, nav/header, modals, forms) and produce a concrete mobile spec: breakpoints (sm/md), single-column stacking rules, min 44px touch targets, mobile nav pattern (hamburger or bottom bar), font sizes, spacing scale, input/button sizing, sticky CTA placement on long scroll pages, and any component-specific mobile behaviors (e.g., tables → cards, side-by-side → stacked). Deliver as a short checklist grouped by component so the engineer can implement mechanically.
2. **Engineer**: Implement the mobile responsiveness spec from the Designer across all React components in src/. Use Tailwind responsive prefixes (default = mobile, sm:/md:/lg: for larger). Ensure: (1) no horizontal scroll at 320px, 375px, 414px widths; (2) all interactive elements ≥44px tap target; (3) forms stack vertically on mobile with full-width inputs; (4) nav collapses to a mobile-appropriate pattern; (5) dashboard tables/grids reflow to stacked cards on mobile; (6) modals/dialogs fit viewport and are scrollable; (7) sticky drop-day CTAs remain reachable; (8) images/SVGs scale fluidly. Run `npm run build` until it exits 0. Do not change desktop layout behavior beyond what's required.
3. **QA**: Verify mobile UX across the full app at 320px, 375px, 414px, and 768px widths using browser devtools responsive mode. Test: landing → sign up → create drop → invite contributors → contributor pledge flow → drop-day CTA → public share page. Check for horizontal overflow, cut-off text, unreachable buttons, broken modals, tiny tap targets, unreadable font sizes, and keyboard behavior when inputs are focused on mobile. Report any issues found with the specific component and viewport width.

---

