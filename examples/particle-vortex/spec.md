# 仕様書（spec）：パーティクルの渦（particle-vortex）

これは「完成イメージ」を掴むためのサンプル仕様書です。Claude Code にこのファイルを渡して「この通りに実装して」と頼めば、動くプロジェクトができます。

## 一言コンセプト
青白い無数の粒が、ゆっくりと渦を巻きながら中心へ吸い込まれ、また外周で生まれてループする。静かで神秘的・宇宙的なループ映像。

## シーン構成
- 背景色：ほぼ黒（#05060a）
- カメラ：position [0, 0, 6] / fov 50
- ライト：なし（粒は自発光＝pointsMaterial の色とBloomで見せる）
- 霧：薄く効かせて奥行きを出す（任意）

## 主役オブジェクト
- 種類：Points + BufferGeometry（点群）
- 数：12,000（levaで変更可、最大30,000程度）
- 形・配置：半径 0.5〜3.0 のディスク状にランダム分布。各粒は中心からの角度と半径を持つ（極座標）

## 動き
- 個々：毎フレーム、角度を少しずつ進め（渦）、半径を少しずつ減らす（吸い込み）。半径が中心に達したら外周へリスポーンして無限ループ
- 全体：ごく僅かにY軸回転で立体感
- マウス連動：マウス位置でカメラがゆっくり追従（弱め）
- ループ：常時ループ（録画してそのまま素材化できる）

## 見た目の質感
- 色：内側ほど白く、外側ほど青い（半径で色を変える）
- 粒サイズ：0.02〜0.04、sizeAttenuation 有効、transparent、加算合成（AdditiveBlending）で光が重なる
- ポストプロセス：Bloom（intensity 1.2 / threshold 0.2）で発光

## leva で触れるパラメータ
- count（粒数）/ speed（渦の速さ）/ inward（吸い込みの強さ）/ colorInner / colorOuter / bloom（発光強度）

## 技術メモ
- 使うライブラリ：three, @react-three/fiber, @react-three/drei, leva, @react-three/postprocessing
- パフォーマンス：位置はFloat32Arrayで保持。useFrameで配列を更新し position.needsUpdate を立てる。new を毎フレームしない
- 実装順：(1)黒背景のCanvas →(2)粒を分布表示 →(3)渦＋吸い込みの動き →(4)色とAdditive＋Bloom →(5)levaでパラメータ露出
- 注意点：粒数を上げすぎると重い。30,000を上限目安に

## 完成後の説明（実装後にClaudeが書くこと）
- `npm install` → `npm run dev` で起動
- 主要ファイル：App.tsx（Canvasと全体）/ Particles.tsx（渦の本体）
- いじると変わる所：leva の speed と inward で渦の印象が大きく変わる。colorInner/Outer で世界観を調整
