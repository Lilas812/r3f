# セットアップ：Vite + React Three Fiber プロジェクト

## 新規プロジェクトの作成手順
```bash
# 1. Vite で React + TypeScript のひな形を作る
npm create vite@latest my-3d -- --template react-ts
cd my-3d

# 2. R3F とアート系で使うライブラリを入れる
npm install three @react-three/fiber
npm install @react-three/drei            # OrbitControls, shaderMaterial 等の便利ヘルパー
npm install leva                          # パラメータ調整GUI
npm install @react-three/postprocessing  # Bloom など発光エフェクト
npm install -D @types/three              # TypeScriptの型

# 3. 開発サーバー起動
npm run dev
```

## 最小の動作確認コード（App.tsx）
```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

export default function App() {
  return (
    // Canvas が3Dの土台。これがブラウザ全面になるよう CSS で 100vw/100vh にする
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="hotpink" />
      </mesh>
      <OrbitControls />  {/* マウスで視点をぐりぐり動かせる */}
    </Canvas>
  )
}
```

## 全画面にするCSS（index.css に追記）
```css
html, body, #root { margin: 0; height: 100%; }
canvas { display: block; }
```

## バージョンの考え方
- ローカル環境なので**最新版でOK**（Claude.aiのArtifactのようなr128固定の制約はない）。
- うまく動かない場合だけ、Claudeに「依存関係のバージョンを揃えて」と頼む。

## 動画にしたいとき
- 完成画面を**画面録画**（macOS: ⌘+Shift+5 / Windows: Win+G）すれば動画素材になる。
- 背景を単色にしておくと、後で編集ソフトで合成しやすい。
- ループする動きにすると、何秒でも使える素材になる。
