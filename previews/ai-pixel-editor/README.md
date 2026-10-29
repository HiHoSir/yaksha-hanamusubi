# 緋月 AI ドット打ちラボ（独立試作）

対象リポジトリ: `HiHoSir/yaksha-hanamusubi`  
改善ブランチ: `improve/ai-pixel-editor-bridge`

## 既存コードの再利用

`pixel-editor.html` をそのまま複製して `previews/ai-pixel-editor/ai-pixel-editor.html` に配置。
描画キャンバス、32pxのパレット、4方向×3ポーズ、PNG/JSON読込・出力、
Undo/Redo、iPhone向けタッチ・カーソルUIは元の実装を再利用する。
元の `pixel-editor.html` およびゲーム本編は変更しない。

追加の `ai-pixel-bridge.js` は、既存のエディタが保持する
「現在のフレームの32×32 RGBA」を**読み取りのみ**で取得し、
JSON形式の画素ごとの差分をプレビューした後にのみ既存のUndo履歴へ保存・適用する。

## 操作

1. ラボを開き、必要なら「既存の緋月32pxを読み込む」を押す。
   `assets/characters/hizuki/field-sd-v3/walk-atlas-32.png` を読み込む。
2. 既存エディタ上で **方向とポーズを選択**する。
3. AIラボの「修正の依頼」に自然文を書き「現在の画素＋依頼文をコピー」する。
4. コピーしたテキストをChatGPTへ貼り付け、返ってきたJSONを「AIから返ってきたJSONパッチ」に貼る。
5. 「差分プレビュー」で変更候補と元画像を比較し、「確認して適用」を押す。
6. 必要なら元エディタのUndo、JSON/PNG書き出しを使う。

## プロトコル

32×32・1フレームに対する**変更画素のみ**を渡す。

```json
{
  "format": "yaksha-pixel-patch-v1",
  "direction": "front",
  "pose": "idle",
  "pixels": [
    {"x": 14, "y": 9, "rgba": [20, 30, 60, 255]},
    {"x": 15, "y": 9, "rgba": [0, 0, 0, 0]}
  ]
}
```

- direction: `front`, `back`, `left`, `right`
- pose: `idle`, `walkA`, `walkB`
- 座標: x,yとも0〜31
- RGBA: 0〜255の整数4値。代替で `color:"#RRGGBB"` または `color:"#RRGGBBAA"` を指定できる
- 方向/ポーズが現フレームと異なる場合、範囲外、RGBA不正は拒否
- プレビュー後に画面の画素が変わった場合は、変更を拒否して再プレビューを要求
- 1024画素以上の大量編集は拒否し、256画素を超える変更は適用前に追加確認
- 肌色保護をONにした場合は既存エディタの保護ルールが適用される
- 適用は1回のUndoスナップショットにまとめる
- AIをエディタから直接呼び出す仕組みではない。**APIキー不要のコピー＆貼り付け方式**。
- 元絵を画像生成で描き直す方式ではない。画素レベルの変更履歴を保持する。
- 64×96px対応や8方向の歩行拡張は未実装。まず既存32px・4方向の安全な実験。

## 検証

- GitHub上のコピーHTMLのインラインJS / 追加JSの構文パース成功
- HTMLのAI操作要素IDの重複・欠落なし
- 擬似DOMで差分プレビュー（適用前は元画像不変）、適用と別方向拒否を確認
- Browser/iPhone Safari実機テスト: 未実施
- Pages branch preview: 未公開、既存の公開用ワークフローにこのブランチが未登録

## 運用

本試作は本編・本番エディタと分離。ユーザー承認前にmainへマージしない。
GitHub Pagesでテストする場合は、承認済みの独立プレビュー公開経路が必要。
