import { useMemo, useRef } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { GRID_COLS, GRID_ROWS, WORDS } from '../words'

// ── 文字粒のシェーダーマテリアル ────────────────────────────────
// 位置・螺旋・上昇・フェード・ビルボードを全て頂点シェーダーで計算する。
// CPUで毎フレーム配列を更新しないので、数千個でも軽い。
const WordParticlesMaterial = shaderMaterial(
  {
    uTime: 0,
    uAtlas: null as THREE.Texture | null,
    uGrid: new THREE.Vector2(GRID_COLS, GRID_ROWS),
    uRiseSpeed: 0.08,
    uSpiral: 1.0,
    uGlobalSpin: 0.04,
    uTopY: 4.4,
    uColorTop: new THREE.Color('#5b8cff'),
    uColorBottom: new THREE.Color('#dff0ff'),
    uOpacity: 1,
  },
  // 頂点シェーダー
  /* glsl */ `
    uniform float uTime;
    uniform float uRiseSpeed;
    uniform float uSpiral;
    uniform float uGlobalSpin;
    uniform float uTopY;
    uniform vec2  uGrid;

    // 粒ごとの個性（インスタンス属性）
    attribute vec4 aMotion; // x:初期角度 y:回転速度 z:半径 w:寿命オフセット
    attribute vec2 aCell;   // アトラスのどのマス（列,行）の言葉か
    attribute float aScale; // 文字の大きさ
    attribute float aStartY;// 生まれる高さ（足元）

    varying vec2  vUv;
    varying float vAlpha;
    varying float vLife;
    varying float vViewZ;

    void main() {
      // life：0で生まれ1で消える。fractで無限ループ。寿命オフセットでバラす
      float life = fract(uTime * uRiseSpeed + aMotion.w);

      // 高さ：足元(aStartY) → 上端(uTopY) へ上昇
      float y = mix(aStartY, uTopY, life);

      // 螺旋：時間とともに角度が進む＋全体回転
      float ang = aMotion.x + aMotion.y * uSpiral * uTime * 0.4 + uGlobalSpin * uTime;
      float rad = aMotion.z * (1.0 - 0.18 * life); // 上るほど少し内側へ
      vec3 center = vec3(cos(ang) * rad, y, sin(ang) * rad);

      // フェード：生まれ際と消え際を透明にして、つなぎ目を消す
      vAlpha = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.78, 1.0, life));
      vLife  = life;

      // ビルボード：板が常にカメラを向くよう、ビュー行列の右/上ベクトルで構築
      vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
      vec3 camUp    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
      // planeGeometry(1,1) の position は ±0.5。横を2倍にして 2:1（セルと同じ比率）
      vec3 worldPos = center + camRight * position.x * aScale * 2.0 + camUp * position.y * aScale;

      // アトラスの自分のマスだけを表示するUV
      vUv = (uv + aCell) / uGrid;

      vec4 viewPos = viewMatrix * vec4(worldPos, 1.0);
      vViewZ = -viewPos.z; // カメラからの距離（奥行きフェード用）
      gl_Position = projectionMatrix * viewPos;
    }
  `,
  // フラグメントシェーダー
  /* glsl */ `
    uniform sampler2D uAtlas;
    uniform vec3  uColorTop;
    uniform vec3  uColorBottom;
    uniform float uOpacity;

    varying vec2  vUv;
    varying float vAlpha;
    varying float vLife;
    varying float vViewZ;

    void main() {
      vec4 tex = texture2D(uAtlas, vUv);
      if (tex.a < 0.02) discard; // 文字以外（透明部分）は描かない

      // 色：下=冷たい白 → 上=青（lifeで補間）
      vec3 col = mix(uColorBottom, uColorTop, vLife);

      // 奥行きフェード：遠い粒を淡くして霧のような立体感を出す
      float haze = smoothstep(11.0, 4.0, vViewZ);
      float a = tex.a * vAlpha * uOpacity * mix(0.3, 1.0, haze);

      // 加算合成（AdditiveBlending）前提：alphaに明るさを載せる
      gl_FragColor = vec4(col, a);
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
}

export default function WordParticles({
  atlas,
  count,
  riseSpeed,
  spiral,
  globalSpin,
  colorBottom,
  colorTop,
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
      const radius = 1.6 + Math.random() * 2.6 // 鏡の外側〜やや遠く
      const lifeOffset = Math.random()
      aMotion[i * 4 + 0] = angle
      aMotion[i * 4 + 1] = angSpeed
      aMotion[i * 4 + 2] = radius
      aMotion[i * 4 + 3] = lifeOffset

      const w = Math.floor(Math.random() * WORDS.length)
      aCell[i * 2 + 0] = w % GRID_COLS
      aCell[i * 2 + 1] = Math.floor(w / GRID_COLS)

      aScale[i] = 0.16 + Math.random() * 0.18
      aStartY[i] = 0.05 + Math.random() * 0.5
    }
    return { aMotion, aCell, aScale, aStartY }
  }, [count])

  // 毎フレーム、時間と調整値をシェーダーへ渡す
  useFrame((state) => {
    const m = matRef.current
    if (!m) return
    m.uTime = state.clock.elapsedTime
    m.uRiseSpeed = riseSpeed
    m.uSpiral = spiral
    m.uGlobalSpin = globalSpin
    m.uColorBottom.set(colorBottom)
    m.uColorTop.set(colorTop)
  })

  return (
    // key={count} で、数を変えたらインスタンスごと作り直す
    // frustumCulled=false：位置をGPUで計算するため自動カリングを無効化（消えないように）
    <instancedMesh key={count} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]}>
        <instancedBufferAttribute attach="attributes-aMotion" args={[attrs.aMotion, 4]} />
        <instancedBufferAttribute attach="attributes-aCell" args={[attrs.aCell, 2]} />
        <instancedBufferAttribute attach="attributes-aScale" args={[attrs.aScale, 1]} />
        <instancedBufferAttribute attach="attributes-aStartY" args={[attrs.aStartY, 1]} />
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
