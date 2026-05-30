# React Three Fiber の基本（初心者向け）

## 考え方
R3F は「Three.js を Reactの部品（JSX）として書ける」もの。3Dの物体を `<mesh>` のようなタグで置いていく感覚。

## 3つの登場人物
1. **Canvas**：3Dの世界そのもの。この中に物を置く。
2. **mesh（メッシュ）**：物体。「形（geometry）」＋「素材（material）」の組み合わせ。
   ```tsx
   <mesh>
     <sphereGeometry args={[1, 32, 32]} />   {/* 形：半径1の球 */}
     <meshStandardMaterial color="cyan" />    {/* 素材：シアン色 */}
   </mesh>
   ```
3. **light（ライト）**：光。これがないと標準マテリアルは真っ暗。

## 動かす：useFrame
毎フレーム呼ばれる関数。ここで位置や回転を少しずつ変えると動く。
```tsx
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

function SpinningBox() {
  const ref = useRef<any>(null)
  useFrame((state, delta) => {
    // delta（前フレームからの経過秒）を掛けると、PCの速さに左右されず一定速度で回る
    ref.current.rotation.y += delta
  })
  return (
    <mesh ref={ref}>
      <boxGeometry />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}
```
- `state.clock.elapsedTime` で「開始からの経過秒」が取れる。波打つ動きなどに便利。

## マウスで視点を回す：OrbitControls（drei）
```tsx
import { OrbitControls } from '@react-three/drei'
// <Canvas> の中に <OrbitControls /> を置くだけ
```

## パラメータをGUIで触る：leva
```tsx
import { useControls } from 'leva'

function Scene() {
  const { speed, color } = useControls({ speed: 1, color: '#00ffff' })
  // speed や color を useFrame やマテリアルに渡すと、画面のツマミで変えられる
}
```

## アート系で覚えておく要点
- **大量の粒**は `<mesh>` を並べない。`Points`（点群）か `InstancedMesh`（同形大量）を使う（→ techniques.md）。
- **滑らかで複雑な動き・色**はシェーダー（GLSL）が強い（→ techniques.md）。
- **発光**は postprocessing の Bloom（→ techniques.md）。
