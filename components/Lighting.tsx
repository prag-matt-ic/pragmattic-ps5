'use client'
import { useGSAP } from '@gsap/react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import React, { type FC, useEffect, useRef } from 'react'
import { DirectionalLight, Object3D } from 'three/webgpu'

import usePS5Store, { Stage } from '@/hooks/usePS5Store'

const PS5Lighting: FC = () => {
  const scene = useThree((s) => s.scene)
  const light = useRef<DirectionalLight>(null)

  const lightIntensity = useRef({ value: 0 })
  const stage = usePS5Store((s) => s.stage)

  useEffect(() => {
    const setupLight = () => {
      if (!scene || !light.current) return
      const targetObject = new Object3D()
      targetObject.position.set(40, 8, 0)
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
      <directionalLight ref={light} position={[8, 20, 0]} intensity={1} castShadow={true} color="#AE9F9D" />
    </>
  )
}

export default PS5Lighting
