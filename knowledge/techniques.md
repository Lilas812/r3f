# 抽象アート系の実装定石（パーティクル / シェーダー / インスタンシング / Bloom）

## 1. パーティクル（点群）— Points + BufferGeometry
大量の粒を軽く描く基本。位置を Float32Array で持つ。
```tsx
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Particles({ count = 10000 }) {
  const ref = useRef<THREE.Points>(null)

  // 粒の初期位置を一度だけ生成（useMemoで再計算を防ぐ＝高速）
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 10 // x
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10 // y
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10 // z
    }
    return arr
  }, [count])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.1 // 全体をゆっくり回す
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#88ccff" sizeAttenuation transparent />
    </points>
  )
}
```
- 動きを粒ごとに変えたいときは、useFrame内で position 配列を書き換え、`geometry.attributes.position.needsUpdate = true` を立てる。さらに凝るならシェーダーへ。

## 2. インスタンシング — 同じ形を大量に、軽く
立方体・球などを数千〜数万個並べるとき。`<mesh>` の量産はNG、`InstancedMesh` を使う。
```tsx
import { useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'

function Cubes({ count = 5000 }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = new THREE.Object3D() // 位置計算用の使い回しオブジェクト

  useLayoutEffect(() => {
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      )
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
    }
    ref.current!.instanceMatrix.needsUpdate = true
  }, [count])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshStandardMaterial color="#ffaa00" />
    </instancedMesh>
  )
}
```

## 3. シェーダー（GLSL）— 滑らかで複雑な動き・色
drei の `shaderMaterial` でカスタムマテリアルを作る。`uTime` を渡して時間で動かす。
```tsx
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { useRef } from 'react'

// uTime（時間）と uColor（色）を受け取るシェーダー
const WaveMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color('#00ffff') },
  // 頂点シェーダー：頂点を時間で上下に波打たせる
  /* glsl */`
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 p = position;
      p.z += sin(p.x * 3.0 + uTime) * 0.3; // X位置と時間で波を作る
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  // フラグメントシェーダー：色を塗る
  /* glsl */`
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      gl_FragColor = vec4(uColor * vUv.y, 1.0); // 上ほど明るいグラデ
    }
  `
)
extend({ WaveMaterial })

function Wave() {
  const ref = useRef<any>(null)
  useFrame((state) => { if (ref.current) ref.current.uTime = state.clock.elapsedTime })
  return (
    <mesh rotation={[-Math.PI / 3, 0, 0]}>
      <planeGeometry args={[10, 10, 64, 64]} /> {/* 分割数を多くすると滑らかに波打つ */}
      {/* @ts-ignore */}
      <waveMaterial ref={ref} />
    </mesh>
  )
}
```
- GLSLには「何をしているか」を日本語コメントで添える（初心者が読めるように）。
- ノイズ（`snoise`等）を入れると有機的なうねりになる。必要時に実装する。

## 4. 発光エフェクト — Bloom（postprocessing）
アート系の“映え”の決め手。明るい部分がにじんで光る。
```tsx
import { EffectComposer, Bloom } from '@react-three/postprocessing'

// <Canvas> の中、シーンの後ろに置く
<EffectComposer>
  <Bloom intensity={1.2} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
</EffectComposer>
```
- 発光させたい物のマテリアルは色を強め（emissive や明るい色）にすると、しきい値を超えて光る。

## 5. マウス連動
```tsx
useFrame((state) => {
  // state.pointer.x / y は -1〜1。カメラやオブジェクトに反映すると視線追従する
  camera.position.x += (state.pointer.x * 2 - camera.position.x) * 0.05
})
```

## パフォーマンスの鉄則
- 量産は `Points` か `InstancedMesh`。`<mesh>` を何千個も置かない。
- 毎フレームの `new`（オブジェクト生成）を避け、useMemo / 使い回しオブジェクトを使う。
- 重い時は粒数を減らす、解像度を下げる、Bloomを軽くする。
