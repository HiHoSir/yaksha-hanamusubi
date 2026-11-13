/* Generated from docs/battle/balance-v2-draft.json; proposal values, not canon. */
window.YK_BATTLE_V2_DATA={
  "schema": "yaksha-battle-balance-proposal-2026-11-13",
  "state": "PROPOSAL_NOT_APPROVED_NOT_RUNTIME",
  "title": "鬼哭の花結び",
  "provenance": {
    "hero": "User-uploaded hizuki-status-v2.json (B formula; authoritative, not changed by this proposal)",
    "enemies": "docs/battle/enemy-stats-proposal-v1.md (v1.1)",
    "distribution": "docs/battle/enemy-distribution-proposal-v1.md",
    "equipment": "docs/battle/equipment-tiers-proposal-v1.md",
    "sales": "docs/battle/equipment-sales-proposal-v1.md",
    "spells": "docs/battle/spell-candidates-2026-11-13.md (12 arts provisional; outside this balance data)"
  },
  "confirmed": {
    "battle": "solo",
    "formula": "floor(atk/2 - defense/4)",
    "physicalVariance": "±1/16 (not included in deterministic checks)",
    "minDamage": "roughly 10% of attacker atk when calculation too small (not included in deterministic checks)",
    "baseline": {
      "dan1": {
        "hp": 26,
        "mp": 12,
        "atk": 9,
        "def": 6,
        "speed": 9
      },
      "growth": {
        "hp": 8,
        "mp": 1.3,
        "atk": 2.6,
        "def": 1.6,
        "speed": 2
      },
      "displayRounding": "half-up"
    },
    "awakening": [
      {
        "id": 1,
        "trigger": "story",
        "hp": 20,
        "atk": 8,
        "def": 0,
        "speed": 0
      },
      {
        "id": 2,
        "trigger": "story",
        "hp": 0,
        "atk": 0,
        "def": 8,
        "speed": 6
      },
      {
        "id": 3,
        "trigger": "story",
        "bonuses": "NOT_YET_DECIDED"
      }
    ],
    "finalBossTargetDan": 40,
    "maxDan": 99,
    "defeat": {
      "goldLossFraction": 0.25,
      "returnTo": "last_visited_town"
    }
  },
  "proposals": {
    "assumptions": {
      "awakeningAtOrAboveDanForTestingOnly": {
        "1": 10,
        "2": 25
      },
      "awakening3": "not modeled"
    },
    "tiers": [
      {
        "id": "T0",
        "weaponAtk": 0,
        "armorDef": 0,
        "headDef": 0,
        "bodyDef": 0,
        "feetDef": 0,
        "danBand": "初期",
        "saleGate": "初期",
        "salePrice": null,
        "expectedGoldPerFight": null,
        "valuesStatus": "v2 bonus totals kept; slot split and sale proposals"
      },
      {
        "id": "T1",
        "weaponAtk": 20,
        "armorDef": 14,
        "headDef": 3,
        "bodyDef": 9,
        "feetDef": 2,
        "danBand": "段5〜7",
        "saleGate": "天妖の社へ向かう前",
        "salePrice": 200,
        "expectedGoldPerFight": 12,
        "valuesStatus": "v2 bonus totals kept; slot split and sale proposals"
      },
      {
        "id": "T2",
        "weaponAtk": 42,
        "armorDef": 30,
        "headDef": 6,
        "bodyDef": 18,
        "feetDef": 6,
        "danBand": "段10",
        "saleGate": "海の入り江へ向かう前",
        "salePrice": 320,
        "expectedGoldPerFight": 18,
        "valuesStatus": "v2 bonus totals kept; slot split and sale proposals"
      },
      {
        "id": "T3",
        "weaponAtk": 64,
        "armorDef": 46,
        "headDef": 9,
        "bodyDef": 28,
        "feetDef": 9,
        "danBand": "段15",
        "saleGate": "忘れの森への道中",
        "salePrice": 550,
        "expectedGoldPerFight": 30,
        "valuesStatus": "v2 bonus totals kept; slot split and sale proposals"
      },
      {
        "id": "T4",
        "weaponAtk": 88,
        "armorDef": 64,
        "headDef": 12,
        "bodyDef": 39,
        "feetDef": 13,
        "danBand": "段18",
        "saleGate": "忘れの森の強敵と戦う前",
        "salePrice": 850,
        "expectedGoldPerFight": 47,
        "valuesStatus": "v2 bonus totals kept; slot split and sale proposals"
      },
      {
        "id": "T5",
        "weaponAtk": 114,
        "armorDef": 84,
        "headDef": 16,
        "bodyDef": 51,
        "feetDef": 17,
        "danBand": "段25",
        "saleGate": "龍神の滝への道へ入る前",
        "salePrice": 1550,
        "expectedGoldPerFight": 86,
        "valuesStatus": "v2 bonus totals kept; slot split and sale proposals"
      },
      {
        "id": "T6",
        "weaponAtk": 140,
        "armorDef": 104,
        "headDef": 20,
        "bodyDef": 63,
        "feetDef": 21,
        "danBand": "段30",
        "saleGate": "九尾の祠方面へ進む前",
        "salePrice": 2400,
        "expectedGoldPerFight": 135,
        "valuesStatus": "v2 bonus totals kept; slot split and sale proposals"
      },
      {
        "id": "T7",
        "weaponAtk": 166,
        "armorDef": 124,
        "headDef": 24,
        "bodyDef": 75,
        "feetDef": 25,
        "danBand": "段35",
        "saleGate": "終盤地域Aの攻略前",
        "salePrice": 3800,
        "expectedGoldPerFight": 215,
        "valuesStatus": "proposal"
      },
      {
        "id": "T8",
        "weaponAtk": 192,
        "armorDef": 144,
        "headDef": 28,
        "bodyDef": 87,
        "feetDef": 29,
        "danBand": "段38〜40",
        "saleGate": "最終決戦前",
        "salePrice": 5400,
        "expectedGoldPerFight": 305,
        "valuesStatus": "proposal"
      }
    ],
    "enemies": [
      {
        "id": "oni_field",
        "name": "野の小鬼",
        "dan": 3,
        "hp": 18,
        "atk": 15,
        "def": 2,
        "speed": 11,
        "exp": 35,
        "spawnClass": "single",
        "region": "field",
        "status": "proposal"
      },
      {
        "id": "tanuki_field",
        "name": "化け狸",
        "dan": 3,
        "hp": 12,
        "atk": 11,
        "def": 2,
        "speed": 14,
        "exp": 21,
        "spawnClass": "pair",
        "region": "field",
        "status": "proposal"
      },
      {
        "id": "lantern_fox",
        "name": "灯火狐",
        "dan": 7,
        "hp": 62,
        "atk": 36,
        "def": 6,
        "speed": 23,
        "exp": 111,
        "spawnClass": "single",
        "region": "shrine_approach",
        "status": "proposal"
      },
      {
        "id": "iso_you",
        "name": "磯妖",
        "dan": 10,
        "hp": 105,
        "atk": 56,
        "def": 12,
        "speed": 26,
        "exp": 179,
        "spawnClass": "single",
        "region": "cove",
        "status": "proposal"
      },
      {
        "id": "foam_jelly",
        "name": "泡くらげ",
        "dan": 10,
        "hp": 70,
        "atk": 44,
        "def": 8,
        "speed": 23,
        "exp": 107,
        "spawnClass": "pair",
        "region": "cove",
        "status": "proposal"
      },
      {
        "id": "kodama",
        "name": "木霊",
        "dan": 18,
        "hp": 170,
        "atk": 106,
        "def": 30,
        "speed": 41,
        "exp": 396,
        "spawnClass": "single",
        "region": "forest",
        "status": "proposal"
      },
      {
        "id": "spider",
        "name": "迷い蜘蛛",
        "dan": 18,
        "hp": 125,
        "atk": 75,
        "def": 24,
        "speed": 46,
        "exp": 238,
        "spawnClass": "pair",
        "region": "forest",
        "status": "proposal"
      },
      {
        "id": "snake",
        "name": "水蛇",
        "dan": 25,
        "hp": 255,
        "atk": 140,
        "def": 36,
        "speed": 55,
        "exp": 617,
        "spawnClass": "single",
        "region": "waterfall_approach",
        "status": "proposal"
      },
      {
        "id": "takiwarashi",
        "name": "滝童",
        "dan": 25,
        "hp": 165,
        "atk": 106,
        "def": 30,
        "speed": 66,
        "exp": 370,
        "spawnClass": "pair",
        "region": "waterfall_approach",
        "status": "proposal"
      },
      {
        "id": "kitsune",
        "name": "妖狐",
        "dan": 30,
        "hp": 300,
        "atk": 170,
        "def": 40,
        "speed": 71,
        "exp": 789,
        "spawnClass": "single",
        "region": "fox_shrine",
        "status": "proposal"
      },
      {
        "id": "late_a",
        "name": "終盤単独敵A（未命名）",
        "dan": 35,
        "hp": 305,
        "atk": 196,
        "def": 48,
        "speed": 80,
        "exp": 972,
        "spawnClass": "single",
        "region": "late_a",
        "status": "proposal"
      },
      {
        "id": "late_b",
        "name": "終盤複数敵B（未命名）",
        "dan": 38,
        "hp": 210,
        "atk": 158,
        "def": 48,
        "speed": 92,
        "exp": 652,
        "spawnClass": "pair",
        "region": "late_b",
        "status": "proposal"
      },
      {
        "id": "late_c",
        "name": "終盤単独敵C（未命名）",
        "dan": 40,
        "hp": 330,
        "atk": 215,
        "def": 54,
        "speed": 96,
        "exp": 1164,
        "spawnClass": "single",
        "region": "late_c",
        "status": "proposal"
      },
      {
        "id": "shadow_ninefox",
        "name": "影九尾（ボス候補）",
        "dan": 30,
        "hp": 1050,
        "atk": 205,
        "def": 60,
        "speed": 76,
        "exp": null,
        "spawnClass": "boss",
        "region": null,
        "status": "proposal"
      }
    ],
    "regions": [
      {
        "id": "field",
        "name": "鬼灯村の外れ",
        "dan": 3,
        "choices": [
          {
            "enemyId": "oni_field",
            "count": 1
          },
          {
            "enemyId": "tanuki_field",
            "count": 2
          }
        ]
      },
      {
        "id": "shrine_approach",
        "name": "天妖の社への参道・野外",
        "dan": 7,
        "choices": [
          {
            "enemyId": "lantern_fox",
            "count": 1
          },
          {
            "enemyId": "tanuki_field",
            "count": 2
          }
        ]
      },
      {
        "id": "cove",
        "name": "海の入り江付近",
        "dan": 10,
        "choices": [
          {
            "enemyId": "iso_you",
            "count": 1
          },
          {
            "enemyId": "foam_jelly",
            "count": 2
          }
        ]
      },
      {
        "id": "forest",
        "name": "忘れの森",
        "dan": 18,
        "choices": [
          {
            "enemyId": "kodama",
            "count": 1
          },
          {
            "enemyId": "spider",
            "count": 2
          }
        ]
      },
      {
        "id": "waterfall_approach",
        "name": "龍神の滝への山道",
        "dan": 25,
        "choices": [
          {
            "enemyId": "snake",
            "count": 1
          },
          {
            "enemyId": "takiwarashi",
            "count": 2
          }
        ]
      },
      {
        "id": "fox_shrine",
        "name": "九尾の祠周辺",
        "dan": 30,
        "choices": [
          {
            "enemyId": "kitsune",
            "count": 1
          }
        ]
      },
      {
        "id": "late_a",
        "name": "終盤地域A（未定）",
        "dan": 35,
        "choices": [
          {
            "enemyId": "late_a",
            "count": 1
          }
        ]
      },
      {
        "id": "late_b",
        "name": "終盤地域B（未定）",
        "dan": 38,
        "choices": [
          {
            "enemyId": "late_b",
            "count": 2
          }
        ]
      },
      {
        "id": "late_c",
        "name": "最終決戦前（地域未定）",
        "dan": 40,
        "choices": [
          {
            "enemyId": "late_c",
            "count": 1
          }
        ]
      }
    ],
    "expectedEncounterCountPerNewDan": [
      8,
      12
    ],
    "equipmentSetGoldCostBattles": [
      15,
      20
    ]
  },
  "blockers": [
    "T4 v2 tier listing said around dan20 but its verified dan18 benchmark uses T4; new proposal uses dan18",
    "T3 and T4 are near one another; distinct sales availability requires credible route",
    "late regions, tier sales places, and new enemy sprites are not yet confirmed",
    "third awakening numeric bonuses and final boss context not yet confirmed",
    "per-monster gold, encounter weights, drop rates, and boss EXP not yet confirmed",
    "old js/battle-rules.js and js/equipment.js do not implement B formula v2; save-migration and integration are separate"
  ]
};
