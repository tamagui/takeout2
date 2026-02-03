import { Stage, useGLTF } from '@react-three/drei'
import { ThreeCanvas } from '@remotion/three'
import { Suspense } from 'react'
import { staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

const modelUrl = staticFile('takeout-compressed-2.glb')

type TakeoutBox3DProps = {
  rotationY?: number
  scale?: number
}

function TakeoutBox3DModel({ rotationY = 0, scale = 0.14 }: TakeoutBox3DProps) {
  const { nodes, materials } = useGLTF(modelUrl) as any

  return (
    <group rotation={[0, rotationY, 0]} dispose={null} scale={scale}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.pack.geometry}
        material={materials['Chinese_Takeout_Box_chinese.002']}
        rotation={[0, 1.571, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.handle.geometry}
        material={materials['Chinese_Takeout_Box_chinese.002']}
        rotation={[0, 1.571, 0]}
      />
    </group>
  )
}

type TakeoutBox3DCanvasProps = {
  width?: number
  height?: number
  rotationSpeed?: number
  initialRotation?: number
}

export const TakeoutBox3DCanvas: React.FC<TakeoutBox3DCanvasProps> = ({
  width = 400,
  height = 400,
  rotationSpeed = 0.02,
  initialRotation = 0,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // entry spin effect - faster at start, then slows down
  const entryEffectFrames = 60
  const entryProgress = Math.min(1, frame / entryEffectFrames)
  const entrySpinSpeed = 0.15 * (1 - entryProgress)
  const normalSpeed = rotationSpeed

  const effectiveSpeed = entrySpinSpeed + normalSpeed
  const rotationY = initialRotation + frame * effectiveSpeed

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 0, 4], fov: 45 }}
    >
      <Suspense fallback={null}>
        <Stage intensity={0.6} environment="city" shadows={false} adjustCamera={false}>
          <TakeoutBox3DModel rotationY={rotationY} />
        </Stage>
      </Suspense>
    </ThreeCanvas>
  )
}

// preload the model
useGLTF.preload(modelUrl)
