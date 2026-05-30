import { useMemo, useRef } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { GRID_COLS, GRID_ROWS, WORDS } from '../words'

// 足元に「消えきれなかった言葉」が積もる堆積層。
// amount（leva）を上げると表示数が増え、少しずつ積もって見える。
const SedimentMaterial = shaderMaterial(
  {
    uTime: 0,
    uAtlas: null as THREE.Texture | null,
    uGrid: new THREE.Vector2(GRID_COLS, GRID_ROWS),
    uAmount: 0.6,
    uGlobalSpin: 0.04,
    uColor: new THREE.Color('#8a93a8'), // 青ざめた灰
  },
  // 頂点シェーダー
  /* glsl */ `
    uniform float uTime;
    uniform float uAmount;
    uniform float uGlobalSpin;
    uniform vec2  uGrid;

    attribute vec3  aPos;   // 足元のドーム内の位置
    attribute vec2  aCell;  // アトラスのマス
    attribute float aScale; // 大きさ
    attribute float aRand;  // 0..1 出現しきい値＆ゆらぎ

    varying vec2  vUv;
    varying float vAlpha;

    void main() {
      // aRand が uAmount 未満のものだけ表示（少しずつ積もる演出）
      float show = step(aRand, uAmount);

      // 全体回転
      float c = cos(uGlobalSpin * uTime);
      float s = sin(uGlobalSpin * uTime);
      vec3 p = aPos;
      p.xz = mat2(c, -s, s, c) * p.xz;

      // ほんのり上下に揺れて、堆積が生きているように
      p.y += sin(uTime * 0.6 + aRand * 6.2831) * 0.02;

      // ビルボード（カメラを向く板）
      vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
      vec3 camUp    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
      vec3 worldPos = p + camRight * position.x * aScale * 2.0 + camUp * position.y * aScale;

      vUv = (uv + aCell) / uGrid;
      vAlpha = show * (0.18 + 0.22 * aRand); // 堆積はうっすら

      gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
    }
  `,
  // フラグメントシェーダー
  /* glsl */ `
    uniform sampler2D uAtlas;
    uniform vec3 uColor;

    varying vec2  vUv;
    varying float vAlpha;

    void main() {
      vec4 tex = texture2D(uAtlas, vUv);
      if (tex.a < 0.02 || vAlpha < 0.001) discard;
      // 加算合成前提：alphaに明るさを載せる
      gl_FragColor = vec4(uColor, tex.a * vAlpha);
    }
  `,
)
extend({ SedimentMaterial })

type Props = {
  atlas: THREE.Texture
  amount: number
  globalSpin: number
}

const SED_COUNT = 900 // 堆積の最大数（表示はamountで絞る）

export default function Sediment({ atlas, amount, globalSpin }: Props) {
  const matRef = useRef<any>(null)
  const grid = useMemo(() => new THREE.Vector2(GRID_COLS, GRID_ROWS), [])

  const attrs = useMemo(() => {
    const aPos = new Float32Array(SED_COUNT * 3)
    const aCell = new Float32Array(SED_COUNT * 2)
    const aScale = new Float32Array(SED_COUNT)
    const aRand = new Float32Array(SED_COUNT)

    for (let i = 0; i < SED_COUNT; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.pow(Math.random(), 0.7) * 3.2 // 中心寄りに密
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      const y = (1.0 - r / 3.4) * 0.7 * Math.random() + 0.02 // 中心ほど高い山
      aPos[i * 3 + 0] = x
      aPos[i * 3 + 1] = y
      aPos[i * 3 + 2] = z

      const w = Math.floor(Math.random() * WORDS.length)
      aCell[i * 2 + 0] = w % GRID_COLS
      aCell[i * 2 + 1] = Math.floor(w / GRID_COLS)

      aScale[i] = 0.12 + Math.random() * 0.12
      aRand[i] = Math.random()
    }
    return { aPos, aCell, aScale, aRand }
  }, [])

  useFrame((state) => {
    const m = matRef.current
    if (!m) return
    m.uTime = state.clock.elapsedTime
    m.uAmount = amount
    m.uGlobalSpin = globalSpin
  })

  return (
    <instancedMesh args={[undefined, undefined, SED_COUNT]} frustumCulled={false}>
      <planeGeometry args={[1, 1]}>
        <instancedBufferAttribute attach="attributes-aPos" args={[attrs.aPos, 3]} />
        <instancedBufferAttribute attach="attributes-aCell" args={[attrs.aCell, 2]} />
        <instancedBufferAttribute attach="attributes-aScale" args={[attrs.aScale, 1]} />
        <instancedBufferAttribute attach="attributes-aRand" args={[attrs.aRand, 1]} />
      </planeGeometry>
      <sedimentMaterial
        ref={matRef}
        uAtlas={atlas}
        uGrid={grid}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
}
