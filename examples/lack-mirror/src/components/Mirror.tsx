import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 中央の歪んだ鏡。暗い鋼青のグラデに、時間で揺れるさざ波。
// 中心はほのかな暖色、うっすら人影（頭＋肩）。縁はやわらかくフェード。
// ライト不要の自発光シェーダー。

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uWarp;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0; // 中心0、端±1
    float r = length(p);

    // さざ波でUVを歪ませる（鏡面のゆらぎ）
    float ripple = sin(r * 14.0 - uTime * 1.2) * 0.012
                 + sin((p.x + p.y) * 8.0 + uTime * 0.8) * 0.010;
    vec2 wuv = uv + ripple * uWarp;

    // 地色：暗い鋼青のグラデ（上が少し明るい）
    vec3 base = mix(vec3(0.02, 0.03, 0.05), vec3(0.06, 0.09, 0.14), wuv.y);

    // 中心のほのかな暖色光（ゆっくり脈打つ）
    float centerGlow = smoothstep(0.95, 0.0, r);
    base += vec3(0.20, 0.12, 0.06) * centerGlow * (0.5 + 0.2 * sin(uTime * 0.5));

    // うっすら人影（頭＋肩）。背景よりほんの少し明るい青白
    vec2 q = wuv - vec2(0.5, 0.52);
    float head = smoothstep(0.16, 0.10, length(q - vec2(0.0, 0.14)));
    float shoulders = smoothstep(0.42, 0.18, length(q * vec2(1.0, 2.2) - vec2(0.0, -0.18)));
    float body = clamp(head + shoulders, 0.0, 1.0);
    base = mix(base, base + vec3(0.05, 0.07, 0.10), body * 0.5);

    // 円の縁をやわらかくフェード（くっきりした輪郭を出さない）
    float alpha = smoothstep(1.0, 0.78, r);

    gl_FragColor = vec4(base, alpha);
  }
`

export default function Mirror({ warp = 0.5 }: { warp?: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWarp: { value: warp },
    }),
    [], // 初期化は一度だけ。値の更新は useFrame で行う
  )

  useFrame((state) => {
    if (!matRef.current) return
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime
    matRef.current.uniforms.uWarp.value = warp
  })

  return (
    // 鏡はカメラ正面（XY平面）に立てる。背面に置くため renderOrder を下げる。
    <mesh position={[0, 1.7, 0]} renderOrder={-1}>
      <circleGeometry args={[1.5, 96]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
