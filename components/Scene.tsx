'use client'
import { useGSAP } from '@gsap/react'
import { OrbitControls, Stats } from '@react-three/drei'
import { Canvas, extend, type ThreeToJSXElements } from '@react-three/fiber'
import gsap from 'gsap'
import { SplitText } from 'gsap/dist/SplitText'
import { type FC, useLayoutEffect, useState } from 'react'
import { type WebGPURendererParameters } from 'three/src/renderers/webgpu/WebGPURenderer.js'
import * as THREE from 'three/webgpu'

import Backdrop from '@/components/Backdrop'
import CameraControls from '@/components/CameraControls'
import Lighting from '@/components/Lighting'
import Particles from '@/components/Particles'

declare module '@react-three/fiber' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE as any)

gsap.registerPlugin(useGSAP, SplitText)

const Scene: FC = () => {
  const [isWebGPUSupported, setIsWebGPUSupported] = useState<boolean | null>(null)

  useLayoutEffect(() => {
    setIsWebGPUSupported(!!navigator?.gpu)
  }, [])

  if (isWebGPUSupported === null) return null

  if (isWebGPUSupported === false) {
    return (
      <section className="flex h-svh flex-col items-center justify-center space-y-4 p-8 text-center">
        <h2 className="text-2xl font-medium tracking-tight">Not supported by this browser</h2>
        <p className="leading-loose text-white/80">
          This experiences uses an experimental technology (WebGPU).
          <br />
          Please open it using a desktop version of Chrome/Edge.
        </p>
      </section>
    )
  }

  return (
    <Canvas
      className="!fixed inset-0 !h-lvh !w-full"
      camera={{ position: [0, 0, 8], fov: 110, far: 100 }}
      performance={{ min: 0.3, debounce: 300 }}
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer(props as WebGPURendererParameters)
        await renderer.init()
        return renderer
      }}>
      <color attach="background" args={['#000210']} />
      <Lighting />
      <Backdrop />
      <Particles />
      <OrbitControls />
      {/* <CameraControls /> */}
      {process.env.NODE_ENV === 'development' && <Stats />}
    </Canvas>
  )
}

export default Scene
