# Iteration Whiteboard

**Change request:** redesign the language to be more simple some of it is trying to hard, can you make a more light friendly ui  on the public page can you show a log table of amounts and date, make a cool interactive hart and animated logs to show statas people can check on. also on this page give them ability to copy message link to send to others

**Subtasks planned:** 3

1. **BrandStrategist**: Audit copy across the app (especially the public drop page, invite emails, and marketing/landing blurbs) and rewrite to be simpler, lighter, and more friendly. Remove try-hard phrases, replace with plain, warm, group-chat-energy language. Deliver a concrete before/after list of every string to change (component/file + old text + new text) so Engineer can apply mechanically. Keep the 'surprise the one' vibe but dial back hype.
2. **Engineer**: Redesign the public drop page (/d/:slug) with a lighter, friendlier UI and add: (1) Apply all copy changes from BrandStrategist. (2) A contributions log table showing contributor name (or Anonymous), amount, and date/time, sorted newest-first, paginated or scrollable, with nice empty state. (3) An interactive chart of pledges over time (e.g. cumulative area chart using recharts or similar) with hover tooltips showing amount + contributor. (4) An animated activity feed/log (Framer Motion) where new pledges/status updates slide in — show statuses like 'pledged', 'sent on drop day', etc. so people can check on progress. (5) A 'Copy invite link' / 'Copy message' button that copies a pre-written friendly share message plus the drop URL to clipboard, with toast confirmation; also include native navigator.share when available. Respect existing privacy (no recipient last name, etc.). Lighten the color palette (soft pastels / airy whites) and increase whitespace. Run npm run build until it exits 0.
3. **QA**: Test the redesigned public drop page: verify copy changes applied, log table renders with real and empty data, chart is interactive and accurate, animated activity feed animates new entries smoothly, Copy Message Link button copies correct text+URL and shows confirmation, native share works on mobile, mobile responsiveness holds up, and no console errors. Report any regressions.

---

