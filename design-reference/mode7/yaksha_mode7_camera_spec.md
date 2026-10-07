# 夜叉姫向け「新桃風」クォータービュー再現仕様

## 目的
『新桃太郎伝説』のワールドで確認した
- Mode 7 回転
- HDMAによる走査線ごとのA/B/C/D更新
- 上側ほど強く縮む非線形パース
を、ブラウザ版『夜叉姫の花結び奇譚』で再現する。

## 1. 基本式

画面縦位置を

`t = y / (height - 1)`

とする。

- `t = 0` : 画面上端（遠景）
- `t = 1` : 画面下端（手前）

近似式:

`scale(t) = far + (near - far) * t^gamma`

初期値:
- `far = 0.34`
- `near = 1.30`
- `gamma = 1.85`

意味:
- 上端では約34%
- 下端では約130%
- 線形ではなく、遠方側を強く圧縮する

## 2. 回転行列

新桃のMode 7行列に合わせ、

A = cosθ × scale  
B = sinθ × scale  
C = -sinθ × scale  
D = cosθ × scale

とする。

## 3. Canvas 2Dでの推奨実装

### 高互換版
- 画面を2〜4px高の横stripに分割
- stripごとに `scale(y)` を計算
- カメラ角度θでワールド座標を回転
- strip単位でsource/destinationを変えて描画

iPhone Safariではまず
- stripHeight = 4
から開始。
余裕があれば2。

### 注意
Canvas 2Dで全4096×4096を毎フレーム変形しない。
カメラ周辺の可視領域だけをオフスクリーンCanvasへ描いてから変形する。

## 4. WebGL版

推奨:
- 1枚の地形テクスチャまたはtile atlas
- vertex/fragment shaderで screenY に応じたscale
- angleはuniform
- player/world centerをuniform

WebGLならHDMA相当を「行ごと」ではなく連続関数として表現できる。

## 5. 推奨カメラ値

夜叉姫初期実装:
- viewport center X = 50%
- horizon-ish area = 25〜30%
- player screen Y = 62〜68%
- far scale = 0.34
- near scale = 1.30
- gamma = 1.85

新桃らしさを強める:
- far = 0.28
- near = 1.35
- gamma = 2.1

酔いにくさ優先:
- far = 0.48
- near = 1.18
- gamma = 1.45

## 6. 方向転換

方向転換時に角度を即時切替しない。

例:
- 4方向なら90度
- 8方向なら45度

補間:
`angle += shortestAngleDelta * 0.18`

60fpsなら100〜180ms程度で追従する感覚にする。

これで以前問題になっていた
「方向転換時のカメラガタつき」
を抑えられる。

## 7. 球面感

単純なperspectiveScaleだけで不足する場合、
横方向も少し圧縮する:

`xScale = scale * (0.94 + 0.06 * t)`

さらに遠方だけ少し中心へ寄せる:

`x' = centerX + (x - centerX) * xScale`

ただし強くすると魚眼になるため控えめにする。

## 8. 遠景霞み

新桃風の完成度には、幾何変形だけでなく遠景処理も重要。

`t < 0.35` で
- saturation低下
- contrast低下
- alphaで薄い空色/霞色を重ねる

ただし元SFCの表現を超えて強くしない。

## 9. 通常マップ

町・村・洞窟はこの変形を使わない。

通常マップ:
- 32×32 game cell
- 内部16×16 subtiles
- 疑似クォータービュー絵
- priority / y-sort
- 通常2Dカメラ

ワールドのみ:
- Mode7風遠近カメラ

## 10. debugmap導入順

1. 既存ワールドを通常描画
2. strip renderer追加
3. `far/near/gamma` をdebug UIで調整可能にする
4. 方向転換補間
5. 遠景霞み
6. iPhone Safariでfps確認
7. 60fps維持できなければ stripHeight 4→6→8

## 11. まず使う推奨値

```js
{
  far: 0.34,
  near: 1.30,
  gamma: 1.85,
  stripHeight: 4,
  playerScreenY: 0.65,
  turnLerp: 0.18
}
```

この値はROM解析で確認した「遠方側で変化量が大きく、手前で緩やかになる」
非線形HDMA補正の性格をブラウザ向けに近似した初期値。
