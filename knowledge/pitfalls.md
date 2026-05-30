# よくある落とし穴と対処

## 画面が真っ黒で何も見えない
- **ライトがない**：`<ambientLight />` と `<pointLight />` を足す（標準マテリアルは光が必要）。
- **カメラが近すぎ/遠すぎ**：`<Canvas camera={{ position: [0,0,5] }}>` の距離を調整。
- **物が原点で重なっている**：位置をばらけさせる。

## カクつく・重い（fpsが落ちる）
- 大量の `<mesh>` を並べていないか → `Points` か `InstancedMesh` に変える。
- useFrame の中で毎フレーム `new THREE.Vector3()` などしていないか → 外で作って使い回す。
- Bloom が強すぎ／粒が多すぎ → 数値を下げる。

## TypeScriptの赤い波線（型エラー）
- カスタムシェーダーのタグ（`<waveMaterial />` 等）で出がち → 一時的に `// @ts-ignore` を上に置くか、Claudeに「型定義を足して」と頼む。
- `@types/three` を入れ忘れていないか確認。

## 粒の位置を動かしても変わらない
- 配列を書き換えた後に `geometry.attributes.position.needsUpdate = true` を立て忘れている。

## マウスで視点が動かない
- `<OrbitControls />` を `<Canvas>` の**中**に置いているか確認。

## 開発サーバーが起動しない / 真っ白
- `npm install` を実行したか。
- ポートが使用中 → ターミナルの指示に従い別ポートで起動、またはClaudeに相談。

## それでも詰まったら
Claude Code に**エラーメッセージをそのまま貼って**「これ直して」と日本語で頼む。原因と修正をやってくれる。
