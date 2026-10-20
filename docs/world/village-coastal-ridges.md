# Village coast and field pace — β16.0.113

Added western, eastern and southern coastal ridge regions around 鬼灯の里 using existing approved mountain sprites. Explicit integer contact/occupied cells remain the collision source. The village clearing and northbound route remain open; coastline and watercourses are retained. World revision 113 safely relocates older saved field positions if a new mountain occupies them.

Field stride duration changes from 144ms to 192ms: 75% of the previous travel speed, with the 32px stride unchanged. Village and interior stride durations remain 144ms. Each motion stores its duration, used consistently by movement completion, chained input, heroine interpolation and camera interpolation. The idle-frame timeout cannot cut off an active stride. Encounter counting stays per step.

Verified: field route/occupancy/watercourse contracts, village spawn, coastal mountain presence, movement math and area-specific duration, camera mid/end interpolation, save compatibility and JavaScript syntax. Inspected the village coast using existing assets in the production projection's cropped native-canvas harness. Browser/device movement feel and iPhone Safari remain separate, unverified checks.
