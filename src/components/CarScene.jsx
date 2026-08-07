import { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows, OrbitControls } from '@react-three/drei'

const CAR_URL = 'https://threejs.org/examples/models/gltf/ferrari.glb'

function Car() {
  const { scene } = useGLTF(CAR_URL)
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.25
  })
  return (
    <primitive
      ref={ref}
      object={scene}
      scale={1.8}
      position={[0, -0.45, 0]}
    />
  )
}

function Loader() {
  return null
}

export default function CarScene() {
  return (
    <Canvas
      camera={{ position: [4.5, 1.8, 5], fov: 40 }}
      shadows
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-4, 2, -4]} intensity={0.4} color="#74f5ff" />
      <pointLight position={[4, 1, 4]} intensity={0.3} color="#0088dd" />

      <Suspense fallback={<Loader />}>
        <Car />
        <Environment preset="city" />
        <ContactShadows
          position={[0, -0.46, 0]}
          opacity={0.5}
          scale={12}
          blur={2.5}
          far={10}
          color="#001133"
        />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate={false}
      />
    </Canvas>
  )
}

useGLTF.preload(CAR_URL)
