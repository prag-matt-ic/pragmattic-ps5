'use client'

import { useDebouncedValue } from '@mantine/hooks'
import { CameraControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import React, { type FC, useEffect, useRef } from 'react'
import { MathUtils } from 'three'

const MIN_POLAR_ANGLE = MathUtils.degToRad(82)
const MAX_POLAR_ANGLE = MathUtils.degToRad(98)

const MIN_AZIMUTH_ANGLE = -Math.PI / 25
const MAX_AZIMUTH_ANGLE = Math.PI / 25

const PS5CameraControls: FC = () => {
  const size = useThree((s) => s.size)
  const [debouncedSize] = useDebouncedValue(size, 500, { leading: true })
  const cameraControls = useRef<CameraControls>(null)
  // Rotation values for pointer move
  const targetPolarAngle = useRef({ value: 0 })
  const targetAzimuthAngle = useRef({ value: 0 })

  useEffect(() => {
    if (!cameraControls.current) return
    if (debouncedSize.width < 480) return

    const onPointerMove = (e: PointerEvent) => {
      const normalizedY = e.clientY / debouncedSize.width
      const newPolarAngle = MathUtils.lerp(MIN_POLAR_ANGLE, MAX_POLAR_ANGLE, normalizedY)
      const normalizedX = e.clientX / debouncedSize.width
      const newAzimuthAngle = MathUtils.lerp(MIN_AZIMUTH_ANGLE, MAX_AZIMUTH_ANGLE, normalizedX)
      targetPolarAngle.current.value = newPolarAngle
      targetAzimuthAngle.current.value = newAzimuthAngle
    }

    window.addEventListener('pointermove', onPointerMove)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [debouncedSize])

  useFrame((_, delta) => {
    if (!cameraControls.current) return
    if (debouncedSize.width < 480) return
    // Move camera to pointer position with lerp for smoothness

    if (cameraControls.current.azimuthAngle !== targetAzimuthAngle.current.value) {
      const newAziumuthAngle = MathUtils.lerp(
        cameraControls.current.azimuthAngle,
        targetAzimuthAngle.current.value,
        delta * 4,
      )
      cameraControls.current.rotateAzimuthTo(newAziumuthAngle, false)
    }

    if (cameraControls.current.polarAngle !== targetPolarAngle.current.value) {
      const newPolarAngle = MathUtils.lerp(cameraControls.current.polarAngle, targetPolarAngle.current.value, delta * 4)
      cameraControls.current.rotatePolarTo(newPolarAngle, false)
    }
  })

  return (
    <CameraControls
      ref={cameraControls}
      minPolarAngle={MIN_POLAR_ANGLE}
      maxPolarAngle={MAX_POLAR_ANGLE}
      minAzimuthAngle={MIN_AZIMUTH_ANGLE}
      maxAzimuthAngle={MAX_AZIMUTH_ANGLE}
      makeDefault={true}
      mouseButtons={{
        left: 0,
        middle: 0,
        right: 0,
        wheel: 0,
      }}
      touches={{
        one: 0,
        two: 0,
        three: 0,
      }}
    />
  )
}

export default PS5CameraControls
