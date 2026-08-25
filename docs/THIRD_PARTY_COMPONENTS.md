# Third-party components

Last verified: 2026-08-25.

This registry covers third-party software and assets distributed by or loaded directly from the Track Start site. The maintenance-mode change adds no dependency, package, copied source code, or external asset.

| Component | Source | Version | License | Use | Notes |
|---|---|---|---|---|---|
| Geist and Geist Mono fonts | Google Fonts / Vercel | Google Fonts hosted version | SIL Open Font License 1.1 | Site typography | Loaded from `fonts.googleapis.com`; not redistributed in this repository. |
| Instrument Serif font | Google Fonts / Instrument | Google Fonts hosted version | SIL Open Font License 1.1 | Display typography | Loaded from `fonts.googleapis.com`; not redistributed in this repository. |
| Node.js built-in modules | Node.js project | Vercel-selected runtime | MIT | Server-side crypto and filesystem operations | No npm dependency is bundled; the project uses runtime built-ins only. |

External services such as Vercel, Supabase, Anthropic, and YooKassa are integrations rather than redistributed components. Their credentials and commercial terms are managed outside the repository. During maintenance mode, payment and AI endpoints reject requests before contacting those services.
