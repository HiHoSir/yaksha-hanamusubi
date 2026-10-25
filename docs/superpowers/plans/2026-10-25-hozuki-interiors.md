# Hozuki facility integration plan

Goal: use the five approved tile rooms as the actual six Hozuki building destinations, with real NPC conversation/services and return doors, then merge into main and publish.

Architecture: a separate `js/interior-maps.js` runtime consumes an exported catalog and the approved placement JSON. The existing game area IDs and save keys remain stable. Main game rendering, movement, collision, interaction, loading and saved-position migration dispatch to the new runtime for Hozuki interiors. Field rest stops keep their existing implementation.

- [x] Export current editor catalog into runtime JSON; introduce a tile runtime with explicit occupied cells, height/stair transitions, two-frame fire/water, fixed door leaves, native SD and existing new-npc art.
- [x] Link inn/shop/tea/osumiHome/farmHome/weaverHome; farmHome becomes doctor, homes retain independent NPC profiles. Place staff behind counters with cardinal counter conversation and no inaccessible paths. Preserve Osumi story name/dialogue and existing rest/shop handlers; add recovery services and door opening interaction.
- [x] Adapt loading, restore migration, movement, exit and main frame drawing; await all destination assets before transition. Preserve quest and field rest-stop state.
- [x] Verify all six door/return routes, NPC approachable positions, counter dialogue, healing/shop flows, group collisions, stairs, doors, failed load retry and saved positions; render production scenes at native scale.
- [ ] Merge current main without dropping concurrent changes; update BETA/HTML cache/JS build together, verify actual binary tree, Actions and production Pages.

Review focus: old interior pixel saves; wider inn dimensions; facing across counters only; no talk through walls; failed preload must not commit area; staff cannot block stairs/exits. No new graphic generation needed. User explicitly authorized main merge.
