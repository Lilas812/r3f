# 仕様書（spec）：〜ない の鏡（lack-mirror）

動画台本の **S07「完璧主義の正体＝『足りない』という欠乏感」** を3Dで象徴する1カット。
チャート系シーン（事実を見せる）と差別化し、ここは「体感（内面）」を見せる役割。

## 一言コンセプト
暗闇に浮かぶ歪んだ鏡のまわりに、無数の「〜ない」という文字粒が泡のように湧き上がり、
螺旋を描いて昇って消える。消えきれない言葉は足元に静かに堆積していく。常時ループ。

## シーン構成
- 背景色：ほぼ黒（#06070b）
- カメラ：position [0, 1.7, 6.2] / fov 50（鏡を正面に捉える）。マウスで弱く追従
- ライト：なし（文字は自発光＝加算合成＋Bloom、鏡はシェーダーで自発光）
- 奥行き：シェーダー内で距離フェード（遠くの文字を淡く）して霧の代わりにする

## 主役オブジェクト
1. **文字粒（WordParticles）**
   - 種類：InstancedMesh（板＝planeGeometry）＋ カスタムシェーダー（ビルボード）
   - 数：1,400（levaで 200〜4,000）
   - 中身：「ない／足りない／できない／賢くない／稼げてない／痩せてない／かっこよくない／
     価値がない／認められない／間に合わない／普通以下／終わってる」の12語を1枚のアトラス画像に焼き、
     各インスタンスがどれか1語を表示
   - 配置：鏡の外周（半径 1.6〜4.2）に分布
2. **堆積層（Sediment）**
   - 種類：同じくInstancedMesh＋アトラス。足元のドーム状（中心ほど高い山）
   - 数：900（うち leva の sediment 値ぶんだけ表示＝積もって見える）
3. **鏡（Mirror）**
   - 種類：円盤（circleGeometry）＋ カスタムシェーダー
   - 見た目：暗い鋼青のグラデに、時間で揺れるさざ波の歪み。中心はほのかな暖色。
     うっすら人影（頭＋肩）。縁はやわらかくフェード

## 動き
- 文字粒（個々）：life=0で足元に生まれ、1で上端に達して消える無限ループ（fractで周回）。
  上昇に合わせて角度が進む（螺旋）。生まれ際・消え際はフェード
- 全体：ごく僅かにY軸回転（globalSpin）で立体感
- 堆積層：sediment 値で表示数が増える＝時間とともに積もる演出
- マウス連動：カメラがポインタ方向へゆっくり追従（弱め）。常に鏡を見る
- ループ：常時ループ（録画してそのまま素材化できる）

## 見た目の質感
- 文字色：下＝冷たい白（colorBottom）→ 上＝青（colorTop）。lifeで補間
- 合成：transparent ＋ AdditiveBlending（加算）で光が重なる。depthWrite=false
- 鏡：通常合成・自発光。renderOrderを下げて背面に
- ポストプロセス：Bloom（intensity≈0.9 / threshold 0.25 / mipmapBlur）で発光

## leva で触れるパラメータ
- wordCount（文字数）/ riseSpeed（上昇の速さ）/ spiral（螺旋の強さ）/ sediment（堆積の量）/
  globalSpin（全体回転）/ mirrorWarp（鏡の歪み）/ bloom（発光強度）/ colorBottom / colorTop

## 技術メモ
- 使うライブラリ：three, @react-three/fiber, @react-three/drei, leva, @react-three/postprocessing
- アトラス：Canvas2Dで12語を1枚に描画→CanvasTextureに。文字描画は一度だけ（useMemo）
- パフォーマンス：位置・螺旋・上昇・フェードは全て頂点シェーダーで計算（CPUで毎フレーム更新しない）。
  ビルボードはviewMatrixの列ベクトルで実装。frustumCulled=false（位置がGPU計算なので自動カリング無効化）
- 実装順：(1)黒背景Canvas →(2)鏡 →(3)文字粒の湧き上がり →(4)堆積層 →(5)色・加算・Bloom →(6)leva露出
- 注意点：wordCountを上げすぎると重い。4,000を上限目安に

## 完成後の説明（起動・主要ファイル・いじる所）
- 起動：`cd examples/lack-mirror` → `npm install` → `npm run dev`
- 主要ファイル：
  - `src/App.tsx`：Canvas・カメラ・leva・Bloom・全体の組み立て
  - `src/words.ts`：表示する言葉と、それを1枚に焼くアトラス生成
  - `src/components/WordParticles.tsx`：湧き上がる文字粒（本体）
  - `src/components/Sediment.tsx`：足元の堆積層
  - `src/components/Mirror.tsx`：中央の歪んだ鏡
- いじると変わる所：leva の riseSpeed/spiral で渦の印象、sediment で堆積量、
  colorBottom/colorTop で世界観、bloom で発光の強さ。言葉そのものは `src/words.ts` の WORDS を編集
- 録画のコツ：levaパネルは録画前に `H` キーで隠せる。12秒ほどで自然にループするので短尺を繰り返し使える
