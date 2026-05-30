import * as THREE from 'three'

// 棒人間（スティックフィギュア）の「集合ターゲット座標」を作る。
// クライマックスで、漂っていた文字粒たちがここへ集まり、人型のシルエットを形作る。
//
// 人型は線分（胴・腕・脚）＋円（頭）の集まりで定義し、
// 各文字インスタンスを、いずれかの部位のランダムな位置に割り当てる。

type Seg = { a: [number, number]; b: [number, number]; w: number } // 線分（w=割り当て重み）
type Circle = { c: [number, number]; r: number; w: number } // 円（頭）

// 人型のパーツ（x, y）。だいたい y=0.1〜3.4、中心 y≈1.8（カメラの注視点付近）。
const SEGS: Seg[] = [
  { a: [0, 2.55], b: [0, 1.3], w: 1.7 }, // 胴
  { a: [0, 2.4], b: [-0.85, 1.6], w: 1.0 }, // 左腕
  { a: [0, 2.4], b: [0.85, 1.6], w: 1.0 }, // 右腕
  { a: [0, 1.3], b: [-0.55, 0.12], w: 1.3 }, // 左脚
  { a: [0, 1.3], b: [0.55, 0.12], w: 1.3 }, // 右脚
]
const HEAD: Circle = { c: [0, 3.0], r: 0.42, w: 1.5 }

// z（奥行き）：鏡(z=0)の手前に薄く配置して、カメラ(z=6.2)から人型として読めるように
const FIGURE_Z = 2.0

export function buildFigureTargets(count: number): Float32Array {
  // 重み付きで部位を選ぶための一覧
  const items: { kind: 'seg' | 'head'; idx: number; w: number }[] = []
  SEGS.forEach((s, i) => items.push({ kind: 'seg', idx: i, w: s.w }))
  items.push({ kind: 'head', idx: 0, w: HEAD.w })
  const total = items.reduce((s, it) => s + it.w, 0)

  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    // 重みに従って部位を1つ選ぶ
    let r = Math.random() * total
    let chosen = items[0]
    for (const it of items) {
      if (r < it.w) {
        chosen = it
        break
      }
      r -= it.w
    }

    let x = 0
    let y = 0
    if (chosen.kind === 'head') {
      // 頭：円周〜やや内側に散らす
      const ang = Math.random() * Math.PI * 2
      const rr = HEAD.r * (0.65 + Math.random() * 0.35)
      x = HEAD.c[0] + Math.cos(ang) * rr
      y = HEAD.c[1] + Math.sin(ang) * rr
    } else {
      // 線分上を等確率でサンプリング
      const s = SEGS[chosen.idx]
      const t = Math.random()
      x = s.a[0] + (s.b[0] - s.a[0]) * t
      y = s.a[1] + (s.b[1] - s.a[1]) * t
    }

    // 線を少し太らせて「文字でできた人」に見えるようジッターを足す
    x += (Math.random() - 0.5) * 0.13
    y += (Math.random() - 0.5) * 0.13
    const z = FIGURE_Z + (Math.random() - 0.5) * 0.3

    out[i * 3 + 0] = x
    out[i * 3 + 1] = y
    out[i * 3 + 2] = z
  }
  return out
}
