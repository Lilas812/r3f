// アニメ全体の「緩急のある一本の流れ」を司る時間管理。
// 等速ループをやめ、次の4フェーズを1サイクルとして繰り返す：
//   1) drift   … 言葉がゆっくり漂い昇る（静か）
//   2) gather  … 一斉に吸い寄せられる（イーズイン＝加速）
//   3) hold    … 棒人間が完成して少し静止（クライマックス）
//   4) disperse… そっと散ってループへ戻る
//
// gather 値（0=漂い / 1=棒人間）を返す。実際の緩急カーブ（イージング）は
// シェーダー側 easeInOutCubic で掛けるので、ここでは素直な 0..1 を返す。

// 各フェーズの「サイクル内での終了位置」(0..1)
const DRIFT_END = 0.4 // 〜40%：漂い
const GATHER_END = 0.58 // 〜58%：集合
const HOLD_END = 0.8 // 〜80%：静止（棒人間）
// 〜100%：拡散

export function getCycleState(elapsed: number, period: number) {
  const cycle = (elapsed % period) / period // 0..1
  let gather = 0
  if (cycle < DRIFT_END) {
    gather = 0
  } else if (cycle < GATHER_END) {
    gather = (cycle - DRIFT_END) / (GATHER_END - DRIFT_END) // 0→1
  } else if (cycle < HOLD_END) {
    gather = 1
  } else {
    gather = 1 - (cycle - HOLD_END) / (1 - HOLD_END) // 1→0
  }
  return { cycle, gather }
}
