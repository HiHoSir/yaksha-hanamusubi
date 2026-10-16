# Prompt template — floor decoration / furniture / architecture

Fill contract variables BEFORE generation; choose only ONE category in the final prompt.

"Create **one isolated game-ready source illustration**, NOT a reference/specification sheet.

Category: [walkable floor decoration / furniture / three-layer architecture].
Subject: [ITEM] in [SPECIFIC APPROVED DESIGN], referencing [EXISTING CANON IMAGE].
Ground footprint: [W×H tiles] = [W*32×H*32 world pixels]. This means **occupied ground cells**, not a huge empty canvas.
Image composition: object nearly fills its intended frame, minimal transparent margin. Preserve exact intended overall silhouette. [For tall architecture: permit top extension above its contact tile.]
Viewpoint: [top-down for thin floor decoration / shallow correct view for furniture / frontal wood face for a column], compatible with existing game village camera. **Do not bake a strong vanishing-point trapezoid into furniture already projected by the engine**.
Details: [minimal approved features]; don't add flowers/tableware/extra decorations beyond contract.
True transparent background (alpha), no white/black/checkerboard painted background, no floor, wall or environment, no drop shadow outside the contact footprint. No text, measurements, graphics grid or poster.
Only the isolated game object, for later deterministic trimming, exact scaling and layer separation."

**Preflight**: source and viewport, footprint, transparency, silhouette and contact defined; reuse/edit considered. Do NOT request unnecessary alternatives.
