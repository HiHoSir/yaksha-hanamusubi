# 緋月・白妙 ユーザー編集済み歩行素材の統合

基準main: 25d0c1862769e0dc065c828e40768d6787c9d298。専用ブランチ improve/approved-hizuki-shirotae-walk。BETA/cache 16.1.62。

ユーザーが両名のプレビューを承認し、歩行の上下動は意図したバウンスと明言した後、ゲームへの取り込みを依頼した。
- 緋月: hizuki-sd-v3-limbs2.json → assets/characters/hizuki/field-sd-v3/
- 白妙: shirotae-walk-fixed(1).json → assets/characters/tenyo-npc-v3/

JSONのバイト列を保存し、RGBAの変更・減色・再整列は行わない。PNGは96×128、行front/back/right/left、列idle/walkA/walkB。manifestに原JSONのSHA256と全コマの外接矩形を記録。

緋月の各方向は従来どおり静止コマの変換を全コマに共用する。バウンスを消すコマ別のアンカー補正は加えない。カメラ・移動・当たり判定は変更しない。フィールド・鬼灯村・屋内・ロード・外観/室内エディタを同じPNGに更新する。

白妙は既存の静止NPC、位置、会話を保つ。SDの可視高基準を28pxに修正。歩行12コマとJSONは将来利用できるが、加入イベント・能力・仲間枠は未実装。

検査: qa/approved-walk-assets.py（原JSON/SHA/RGBA完全一致）、qa/approved-walk-runtime.cjs（全方向の変換固定/バウンス保護・白妙方向/倍率・参照先）、runtime-build-contract、sprite-outline-unit、sd-outline-integration。PagesとSafariはこれらのローカル検査とは別に確認する。
