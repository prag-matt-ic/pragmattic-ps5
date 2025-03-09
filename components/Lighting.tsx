'use client'
import { useThree } from '@react-three/fiber'
import React, { type FC, useEffect, useRef } from 'react'
import { DirectionalLight, Object3D } from 'three/webgpu'

const PS5Lighting: FC = () => {
  const scene = useThree((s) => s.scene)
  const light = useRef<DirectionalLight>(null)

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

  return (
    <directionalLight
      ref={light}
      position={[8, 20, 0]}
      intensity={18}
      castShadow={true}
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      color="#AE9F9D"
    />
  )
}

export default PS5Lighting
