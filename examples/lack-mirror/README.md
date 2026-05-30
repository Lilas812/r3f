# 〜ない の鏡（lack-mirror）

動画台本「若者の完璧主義はなぜ過去最高か」の **S07** を3D化した抽象アニメーション。
暗闇の歪んだ鏡のまわりに「〜ない」という言葉が泡のように湧き上がり、螺旋で昇って消え、
足元には消えきれない言葉が静かに堆積していく——「足りない」という欠乏感を象徴する1カット。

## 起動方法
```bash
cd examples/lack-mirror
npm install
npm run dev
```
表示された `http://localhost:5173` をブラウザで開く。

## 主要ファイル（1行ずつ）
- `src/App.tsx` … Canvas・カメラ・leva（ツマミ）・Bloom・全体の組み立て
- `src/words.ts` … 表示する言葉（WORDS）と、それを1枚に焼くアトラス生成
- `src/components/WordParticles.tsx` … 湧き上がる文字粒（本体・シェーダーで上昇＆螺旋）
- `src/components/Sediment.tsx` … 足元の堆積層
- `src/components/Mirror.tsx` … 中央の歪んだ鏡（うっすら人影）

## ここをいじると見た目が変わる（画面右上のleva）
- **riseSpeed / spiral** … 湧き上がりの速さと螺旋の強さ（渦の印象が大きく変わる）
- **sediment** … 足元にどれだけ積もるか
- **globalSpin** … 全体のゆっくりした回転
- **mirrorWarp** … 鏡面のゆらぎ
- **bloom** … 発光の強さ
- **colorBottom / colorTop** … 文字色（下＝白 → 上＝青）
- 言葉そのものを変えるなら `src/words.ts` の `WORDS` 配列を編集

## 録画のコツ（動画素材にする）
- 録画前に `H` キーで leva パネルを隠せる。
- 12秒ほどで自然にループするので、短く録ってS07（約65秒）に繰り返し重ねられる。
- 背景は単色の黒なので、編集ソフトでの合成もしやすい。

## つまずきやすい点
- 文字が□（豆腐）になる … 日本語フォントが無い環境。`src/words.ts` のフォント候補を環境のものに変える。
- 重い … leva の `wordCount` を下げる、`bloom` を下げる。
