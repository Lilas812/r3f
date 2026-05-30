import { useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useControls } from 'leva'
import * as THREE from 'three'
import { buildWordAtlas } from './words'
import WordParticles from './components/WordParticles'
import Sediment from './components/Sediment'
import Mirror from './components/Mirror'

// マウスでカメラをゆっくり追従させる（弱め）。常に鏡を見る。
function Rig() {
  useFrame((state) => {
    const p = state.pointer
    state.camera.position.x += (p.x * 0.6 - state.camera.position.x) * 0.03
    state.camera.position.y += (1.7 + p.y * 0.3 - state.camera.position.y) * 0.03
    state.camera.lookAt(0, 1.7, 0)
  })
  return null
}

export default function App() {
  // 文字アトラスは一度だけ作り、各コンポーネントで使い回す
  const atlas = useMemo(() => buildWordAtlas(), [])

  // leva：画面右上のツマミで触れるパラメータ
  const ctrl = useControls({
    wordCount: { value: 1400, min: 200, max: 4000, step: 100 },
    riseSpeed: { value: 0.08, min: 0.01, max: 0.3, step: 0.01 },
    spiral: { value: 1.0, min: 0, max: 3, step: 0.1 },
    sediment: { value: 0.6, min: 0, max: 1, step: 0.01 },
    globalSpin: { value: 0.04, min: 0, max: 0.3, step: 0.01 },
    mirrorWarp: { value: 0.5, min: 0, max: 2, step: 0.05 },
    bloom: { value: 0.9, min: 0, max: 2.5, step: 0.05 },
    colorBottom: '#dff0ff', // 下＝冷たい白
    colorTop: '#5b8cff', // 上＝青
  })

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 1.7, 6.2], fov: 50 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color('#06070b')
        }}
      >
        <Rig />

        {/* 中央の歪んだ鏡（うっすら人影） */}
        <Mirror warp={ctrl.mirrorWarp} />

        {/* 下から湧き上がる「〜ない」の文字粒 */}
        <WordParticles
          atlas={atlas}
          count={ctrl.wordCount}
          riseSpeed={ctrl.riseSpeed}
          spiral={ctrl.spiral}
          globalSpin={ctrl.globalSpin}
          colorBottom={ctrl.colorBottom}
          colorTop={ctrl.colorTop}
        />

        {/* 足元に溜まっていく堆積層 */}
        <Sediment atlas={atlas} amount={ctrl.sediment} globalSpin={ctrl.globalSpin} />

        {/* 発光（にじむ光）。アート系の映えの要 */}
        <EffectComposer>
          <Bloom
            intensity={ctrl.bloom}
            luminanceThreshold={0.25}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
