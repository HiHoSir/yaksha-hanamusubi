# 世界地図拡張設計 v0.5

## ROM分析の扱い
個人Libraryから world_map_4096.png (4096×4096 RGB) と metatiles_192_labeled.png を取得して確認済み。
北部の雪原、西側から南へ伸びる陸地、東側の陸地、中央付近の島状地形を視認。ただし国境・港・橋の正確な位置は未確定。
原作ROM由来の画像・タイル・輪郭座標・地形マスクは公開版へ含めない。

## 新大陸
世界地図上では小島、ゲーム本体では既存80×80、32pxセルの js/world.js (revision 88) を維持。
調査画像の南西海域 (1550, 3550)/4096、正規化(0.3784,0.8667) を暫定候補とする。
これは研究用の参照位置。公開地図用の海岸線はオリジナルで設計し直す。

## 章進行
1 新大陸：鬼灯の里→天妖の社→海の入り江→忘れの森→龍神の滝→九尾の祠→入り江再訪
→船→
2 花と木の国 →山・洞窟→
3 冬と星の国 →東の橋→
4 ほほえみの大地 →南の橋→
5 希望と絶望の大地 →海路→
6 愛と勇気の国 →最終航路→
7 鬼ヶ島

接続経路はシナリオ案。原作の正確な接続点と地域境界は未確定。

## 論理データ契約
worldId: world.new_continent / world.mainland / 必要ならworld.onigashima
regionId: region.new_continent / region.flower_tree / region.winter_star / region.smile / region.hope_despair / region.love_courage / region.onigashima
chapterId: chapter.01.new_continent ～ chapter.07.onigashima
既存 x/y、worldPosition、quest、legacy移行、migratePosition()、place ID 7件、初期クエスト順を維持し、旧セーブの新項目はoptional fallbackとする。

## 実装順
1 非公開ROM参照資料で地理の未確定事項を確認。
2 著作権上独立したオリジナル輪郭を手設計。
3 ゲームに影響しない単独デバッグ画面と検証。
4 地域レジストリ/世界地図UIを追加。
5 既存ストーリー後に港の章間移動を足し、旧セーブを回帰テスト。

本ファイルは設計資料でゲーム本体への機能実装ではない。
