// GLSL用のイージング関数集（文字列）。シェーダーに差し込んで使う。
// 「同じ速度で面白くない」を解消するための緩急カーブ。
// 参考: Robert Penner / easings.net の定番カーブを GLSL に移植。
export const EASING_GLSL = /* glsl */ `
  // ゆっくり始まり加速（吸い込まれる感じ）
  float easeInCubic(float t){ return t*t*t; }
  // 速く始まりゆっくり止まる（着地・収束）
  float easeOutCubic(float t){ float u = 1.0 - t; return 1.0 - u*u*u; }
  // 行って戻る前のタメ→走る→止まる（最も「映える」緩急）
  float easeInOutCubic(float t){
    return t < 0.5 ? 4.0*t*t*t : 1.0 - pow(-2.0*t + 2.0, 3.0) / 2.0;
  }
  // 終わりで少し行き過ぎて戻る（生っぽい着地のオーバーシュート）
  float easeOutBack(float t){
    float c1 = 1.70158; float c3 = c1 + 1.0;
    float u = t - 1.0;
    return 1.0 + c3 * u*u*u + c1 * u*u;
  }
`
