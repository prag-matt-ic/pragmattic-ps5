'use client'
import { useGSAP } from '@gsap/react'
import { OrbitControls, Stats } from '@react-three/drei'
import { Canvas, extend, type ThreeToJSXElements } from '@react-three/fiber'
import gsap from 'gsap'
import { SplitText } from 'gsap/dist/SplitText'
import { type FC, useLayoutEffect, useState } from 'react'
import { type WebGPURendererParameters } from 'three/src/renderers/webgpu/WebGPURenderer.js'
import * as THREE from 'three/webgpu'

import PS5Backdrop from '@/components/Backdrop'
import CameraControls from '@/components/CameraControls'
import PS5Lighting from '@/components/Lighting'
import PS5Particles from '@/components/Particles'

declare module '@react-three/fiber' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE as any)

gsap.registerPlugin(useGSAP, SplitText)

const PS5LoadingScene: FC = () => {
  const [isWebGPUSupported, setIsWebGPUSupported] = useState<boolean | null>(null)

  useLayoutEffect(() => {
    setIsWebGPUSupported(!!navigator?.gpu)
  }, [])

  if (isWebGPUSupported === null) return null

  if (isWebGPUSupported === false) {
    return (
      <section className="flex h-screen flex-col items-center justify-center space-y-4 text-center">
        <h2 className="text-xl">Not yet supported</h2>
        <p className="text-white/80">
          This experiences uses an experimental technology (WebGPU) not yet supported by your browser.
          <br />
          Please open it using a desktop version of Chrome/Edge.
        </p>
      </section>
    )
  }

  return (
    <Canvas
      className="!fixed inset-0"
      camera={{ position: [0, 0, 8], fov: 110 }}
      performance={{ min: 0.3, debounce: 300 }}
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer(props as WebGPURendererParameters)
        await renderer.init()
        return renderer
      }}>
      <color attach="background" args={['#000210']} />
      <ambientLight intensity={6} />
      <PS5Backdrop />
      <PS5Particles />
      <PS5Lighting />
      {/* <OrbitControls /> */}
      <CameraControls />
      {/* {process.env.NODE_ENV === 'development' && <Stats />} */}
    </Canvas>
  )
}

export default PS5LoadingScene
