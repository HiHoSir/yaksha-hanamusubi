---
name: sites-private-debug
description: Maintain isolated private debug sites without touching public production or exposing ROM-derived assets.
---
# Private debug sites
- Create a separate site for each isolated internal investigation; never overwrite the existing 夜叉姫 production site.
- Set access to self-only if the target product supports it; **verify** access control before uploading sensitive or ROM-derived materials.
- If self-only access cannot be verified, stop; do not substitute a public GitHub Pages site.
- Keep experiment ZIP layout and referenced relative asset paths intact.
- Validate index.html, asset presence, mobile Safari usability and smoke tests.
- Avoid publishing ROM-derived tiles or other third-party protected materials in a public game; replace with original sources for public builds.
- Record site ID, access policy, tested URL, cleanup/deletion path and production-site untouched status.
