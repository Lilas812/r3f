import * as THREE from 'three'

// 鏡に湧く「〜ない」たち。台本S07の「足りない＝欠乏感」を象徴する言葉。
// ここを書き換えると、画面に出る言葉が変わる。
export const WORDS = [
  'ない',
  '足りない',
  'できない',
  '賢くない',
  '稼げてない',
  '痩せてない',
  'かっこよくない',
  '価値がない',
  '認められない',
  '間に合わない',
  '普通以下',
  '終わってる',
] as const

// アトラス（言葉を1枚にまとめた画像）の格子。4×3 = 12語。
export const GRID_COLS = 4
export const GRID_ROWS = 3

// 12語を1枚の画像に焼き込む（テクスチャアトラス）。
// 各セルに1語ずつ中央配置。白文字＋淡い発光で、加算合成＆Bloom に映える。
// 文字描画は重いので、useMemo で一度だけ呼ぶこと。
export function buildWordAtlas(): THREE.CanvasTexture {
  const cellW = 512
  const cellH = 256
  const canvas = document.createElement('canvas')
  canvas.width = cellW * GRID_COLS // 2048
  canvas.height = cellH * GRID_ROWS // 768
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 日本語フォントの候補（Mac→Win の順）。環境にある最初のものが使われる。
  const fontFamily =
    '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif'

  WORDS.forEach((word, i) => {
    const col = i % GRID_COLS
    const row = Math.floor(i / GRID_COLS)
    const cx = col * cellW + cellW / 2
    const cy = row * cellH + cellH / 2

    // セル幅に収まるよう文字サイズを自動で詰める
    let fontSize = 150
    ctx.font = `700 ${fontSize}px ${fontFamily}`
    while (ctx.measureText(word).width > cellW * 0.86 && fontSize > 24) {
      fontSize -= 4
      ctx.font = `700 ${fontSize}px ${fontFamily}`
    }

    // ほのかな発光（影）でにじませてから白文字を描く
    ctx.shadowColor = 'rgba(180,220,255,0.9)'
    ctx.shadowBlur = 22
    ctx.fillStyle = '#ffffff'
    ctx.fillText(word, cx, cy)
  })

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = false
  tex.needsUpdate = true
  return tex
}
