# 鬼灯村 new-npc キャラクター対応表

2026-10-24 採用。名称は「鬼灯村」（旧称「鬼灯の里」）。目の形状修正版（eye-shapes-v2）12人が外見の正本です。

既存ID・role・typeは取得した `js/settlement.js` の照合情報であり、本コミットは既存データを変更しません。新しい素材は **NPCのtypeではなく個別IDで対応**させてください。既存typeは複数の人物で共有されています。

| 素材ID | 鬼灯村の人物 | 既存NPC ID | 既存role | 既存type | 現行エリア／屋内ID | アトラス |
|---|---|---|---|---|---|---|
| `chief` | 里長 | `chief` | `elder` | `elder` | `屋外` | [chief.png](chief.png) |
| `child-square` | 広場の子 | `child-square` | `child` | `child` | `屋外` | [child-square.png](child-square.png) |
| `farmer` | 畑守り | `farmer` | `farmer` | `merchant` | `屋外` | [farmer.png](farmer.png) |
| `weaver` | 織り手 | `weaver` | `weaver` | `woman` | `屋外` | [weaver.png](weaver.png) |
| `child-garden` | 畑の子 | `child-garden` | `child` | `child` | `屋外` | [child-garden.png](child-garden.png) |
| `fisher` | 川仕事の老人 | `fisher` | `fisher` | `elder` | `屋外` | [fisher.png](fisher.png) |
| `traveler` | 旅人 | `traveler` | `traveler` | `merchant` | `屋外` | [traveler.png](traveler.png) |
| `shrine-keeper` | 社の世話役 | `shrine-keeper` | `elder` | `elder` | `屋外` | [shrine-keeper.png](shrine-keeper.png) |
| `osumi` | お澄 | `osumi` | `woman` | `woman` | `osumiHome` | [osumi.png](osumi.png) |
| `teagirl` | 茶屋娘 | `tea-host` | `teagirl` | `teagirl` | `teahouse` | [teagirl.png](teagirl.png) |
| `merchant` | よろず屋 | `shopkeeper` | `merchant` | `merchant` | `shop` | [merchant.png](merchant.png) |
| `innkeeper` | 宿の女将 | `inn-host` | `innkeeper` | `teagirl` | `inn` | [innkeeper.png](innkeeper.png) |

「広場の子」「畑の子」は素材を識別する呼称です。現行の会話表示名はどちらも「里の子」です。「お澄」の現行名は「里の女・お澄」。屋内担当のIDは `insideResidents()` の roomResidents 定義を参照しています。会話・表示名・配置の変更は今回の保存には含みません。
