import { useMemo, useRef } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { GRID_COLS, GRID_ROWS, WORDS } from '../words'
import { buildFigureTargets } from '../figure'
import { getCycleState } from '../cycle'
import { EASING_GLSL } from '../easing.glsl'

// ── 文字粒のシェーダーマテリアル ────────────────────────────────
// 位置・螺旋・上昇・フェード・ビルボードに加え、
// 「漂い(drift)→集合(gather)→棒人間(figure)」の補間も頂点シェーダーで行う。
// uGather（0=漂い / 1=棒人間）を CPU から渡し、緩急は easeInOutCubic で付ける。
const WordParticlesMaterial = shaderMaterial(
  {
    uTime: 0,
    uAtlas: null as THREE.Texture | null,
    uGrid: new THREE.Vector2(GRID_COLS, GRID_ROWS),
    uRiseSpeed: 0.08,
    uSpiral: 1.0,
    uGlobalSpin: 0.04,
    uTopY: 4.4,
    uGather: 0,
    uColorTop: new THREE.Color('#5b8cff'),
    uColorBottom: new THREE.Color('#dff0ff'),
    uFigureTint: new THREE.Color('#fff1da'),
    uOpacity: 1,
  },
  // 頂点シェーダー（イージング関数を先頭に差し込む）
  EASING_GLSL +
    /* glsl */ `
    uniform float uTime;
    uniform float uRiseSpeed;
    uniform float uSpiral;
    uniform float uGlobalSpin;
    uniform float uTopY;
    uniform float uGather;   // 0=漂い 1=棒人間

    uniform vec2  uGrid;

    // 粒ごとの個性（インスタンス属性）
    attribute vec4 aMotion; // x:初期角度 y:回転速度 z:半径 w:寿命オフセット(=集合のばらけ種)
    attribute vec2 aCell;   // アトラスのどのマス（列,行）の言葉か
    attribute float aScale; // 文字の大きさ
    attribute float aStartY;// 生まれる高さ（足元）
    attribute vec3  aTarget;// 棒人間になるときの目標座標

    varying vec2  vUv;
    varying float vAlpha;
    varying float vLife;
    varying float vViewZ;
    varying float vFigure;

    void main() {
      // ── 漂い(drift)の位置 ──
      // life：0で生まれ1で消える。fractで無限ループ。寿命オフセットでバラす
      float life = fract(uTime * uRiseSpeed + aMotion.w);
      float y = mix(aStartY, uTopY, life);
      float ang = aMotion.x + aMotion.y * uSpiral * uTime * 0.4 + uGlobalSpin * uTime;
      float rad = aMotion.z * (1.0 - 0.18 * life); // 上るほど少し内側へ
      vec3 driftPos = vec3(cos(ang) * rad, y, sin(ang) * rad);
      float driftAlpha = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.78, 1.0, life));

      // ── 集合(gather)：粒ごとに少しずつ到達時刻をずらして「組み上がる」感じに ──
      float STAG = 0.35; // ばらけ幅
      float g = clamp(uGather * (1.0 + STAG) - aMotion.w * STAG, 0.0, 1.0);
      g = easeInOutCubic(g); // ここで緩急（タメ→走る→止まる）

      // 漂い位置 → 棒人間の目標へ補間
      vec3 center = mix(driftPos, aTarget, g);
      float alpha = mix(driftAlpha, 0.92, g); // 集合すると消えず留まる
      float scale = aScale * mix(1.0, 0.8, g); // 集合時は少し縮めて線を締める

      vAlpha = alpha;
      vLife  = life;
      vFigure = g;

      // ビルボード：板が常にカメラを向くよう、ビュー行列の右/上ベクトルで構築
      vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
      vec3 camUp    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
      vec3 worldPos = center + camRight * position.x * scale * 2.0 + camUp * position.y * scale;

      // アトラスの自分のマスだけを表示するUV
      vUv = (uv + aCell) / uGrid;

      vec4 viewPos = viewMatrix * vec4(worldPos, 1.0);
      vViewZ = -viewPos.z;
      gl_Position = projectionMatrix * viewPos;
    }
  `,
  // フラグメントシェーダー
  /* glsl */ `
    uniform sampler2D uAtlas;
    uniform vec3  uColorTop;
    uniform vec3  uColorBottom;
    uniform vec3  uFigureTint;
    uniform float uOpacity;

    varying vec2  vUv;
    varying float vAlpha;
    varying float vLife;
    varying float vViewZ;
    varying float vFigure;

    void main() {
      vec4 tex = texture2D(uAtlas, vUv);
      if (tex.a < 0.02) discard; // 文字以外（透明部分）は描かない

      // 色：下=冷たい白 → 上=青（lifeで補間）。棒人間時は暖色へ寄せてクライマックス感
      vec3 col = mix(uColorBottom, uColorTop, vLife);
      col = mix(col, uFigureTint, vFigure * 0.6);

      // 奥行きフェード：遠い粒を淡くして霧のような立体感を出す
      float haze = smoothstep(12.0, 4.0, vViewZ);
      float a = tex.a * vAlpha * uOpacity * mix(0.25, 1.0, haze);

      gl_FragColor = vec4(col, a); // 加算合成前提
    }
  `,
)
extend({ WordParticlesMaterial })

type Props = {
  atlas: THREE.Texture
  count: number
  riseSpeed: number
  spiral: number
  globalSpin: number
  colorBottom: string
  colorTop: string
  formFigure: boolean
  cycleSeconds: number
}

export default function WordParticles({
  atlas,
  count,
  riseSpeed,
  spiral,
  globalSpin,
  colorBottom,
  colorTop,
  formFigure,
  cycleSeconds,
}: Props) {
  const matRef = useRef<any>(null)
  const grid = useMemo(() => new THREE.Vector2(GRID_COLS, GRID_ROWS), [])

  // 粒ごとの初期値を一度だけ生成（count が変わった時だけ作り直す）
  const attrs = useMemo(() => {
    const aMotion = new Float32Array(count * 4)
    const aCell = new Float32Array(count * 2)
    const aScale = new Float32Array(count)
    const aStartY = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const angSpeed = (0.4 + Math.random() * 0.6) * (Math.random() < 0.5 ? -1 : 1)
      const radius = 1.8 + Math.random() * 3.0 // 鏡の外側〜遠くまで広く
      const lifeOffset = Math.random()
      aMotion[i * 4 + 0] = angle
      aMotion[i * 4 + 1] = angSpeed
      aMotion[i * 4 + 2] = radius
      aMotion[i * 4 + 3] = lifeOffset

      const w = Math.floor(Math.random() * WORDS.length)
      aCell[i * 2 + 0] = w % GRID_COLS
      aCell[i * 2 + 1] = Math.floor(w / GRID_COLS)

      aScale[i] = 0.18 + Math.pow(Math.random(), 1.8) * 0.45
      aStartY[i] = 0.05 + Math.random() * 0.5
    }
    // 棒人間の目標座標（クライマックスでここへ集まる）
    const aTarget = buildFigureTargets(count)
    return { aMotion, aCell, aScale, aStartY, aTarget }
  }, [count])

  // 毎フレーム、時間・調整値・集合度(gather)をシェーダーへ渡す
  useFrame((state) => {
    const m = matRef.current
    if (!m) return
    const t = state.clock.elapsedTime
    m.uTime = t
    m.uRiseSpeed = riseSpeed
    m.uSpiral = spiral
    m.uGlobalSpin = globalSpin
    m.uColorBottom.set(colorBottom)
    m.uColorTop.set(colorTop)
    // 棒人間サイクルのON/OFF。OFFなら常に漂い(0)
    m.uGather = formFigure ? getCycleState(t, cycleSeconds).gather : 0
  })

  return (
    <instancedMesh key={count} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]}>
        <instancedBufferAttribute attach="attributes-aMotion" args={[attrs.aMotion, 4]} />
        <instancedBufferAttribute attach="attributes-aCell" args={[attrs.aCell, 2]} />
        <instancedBufferAttribute attach="attributes-aScale" args={[attrs.aScale, 1]} />
        <instancedBufferAttribute attach="attributes-aStartY" args={[attrs.aStartY, 1]} />
        <instancedBufferAttribute attach="attributes-aTarget" args={[attrs.aTarget, 3]} />
      </planeGeometry>
      <wordParticlesMaterial
        ref={matRef}
        uAtlas={atlas}
        uGrid={grid}
        uTopY={4.4}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
}
