'use client'
import { useGSAP } from '@gsap/react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import React, { type FC, useEffect, useRef } from 'react'
import { DirectionalLight, Object3D } from 'three/webgpu'

import usePS5Store, { Stage } from '@/hooks/usePS5Store'

const Lighting: FC = () => {
  const scene = useThree((s) => s.scene)
  const light = useRef<DirectionalLight>(null)

  const lightIntensity = useRef({ value: 0 })
  const stage = usePS5Store((s) => s.stage)

  useEffect(() => {
    const setupLight = () => {
      if (!scene || !light.current) return
      const targetObject = new Object3D()
      targetObject.position.set(24, -4, 2)
      scene.add(targetObject)
      light.current.target = targetObject
    }

    setupLight()
  }, [scene])

  useGSAP(
    () => {
      const targetIntensity = stage === Stage.RESTART ? 0 : 18
      if (lightIntensity.current.value === targetIntensity) return
      gsap.to(lightIntensity.current, {
        value: targetIntensity,
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (!light.current) return
          light.current.intensity = lightIntensity.current.value
        },
      })
    },
    { dependencies: [stage] },
  )

  return (
    <>
      <ambientLight intensity={4} />
      <directionalLight ref={light} position={[-4, 4, 4]} intensity={0} color="#AE9F9D" />
    </>
  )
}

export default Lighting
