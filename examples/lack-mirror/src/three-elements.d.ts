// 自作シェーダーマテリアル（extend で追加したタグ）を
// TypeScript / JSX に認識させるための型宣言。
// これが無いと <wordParticlesMaterial> 等で赤い波線（型エラー）が出る。
import type { Object3DNode } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      wordParticlesMaterial: Object3DNode<any, any>
      sedimentMaterial: Object3DNode<any, any>
    }
  }
}

export {}
