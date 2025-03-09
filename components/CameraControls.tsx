'use client'

import { useDebouncedValue } from '@mantine/hooks'
import { CameraControls as DreiCameraControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import React, { type FC, useEffect, useRef } from 'react'
import { MathUtils } from 'three'

const MIN_POLAR_ANGLE_RAD = MathUtils.degToRad(80)
const MAX_POLAR_ANGLE_RAD = MathUtils.degToRad(100)

const MIN_AZIMUTH_ANGLE = -Math.PI / 24
const MAX_AZIMUTH_ANGLE = Math.PI / 24

const CameraControls: FC = () => {
  const size = useThree((s) => s.size)
  const [debouncedSize] = useDebouncedValue(size, 500, { leading: true })
  const cameraControls = useRef<DreiCameraControls>(null)
  // Rotation values for pointer move
  const targetPolarAngle = useRef({ value: 0 })
  const targetAzimuthAngle = useRef({ value: 0 })

  useEffect(() => {
    if (!cameraControls.current) return

    if (debouncedSize.width < 480) {
      cameraControls.current.setLookAt(
        0,
        0,
        10, // New camera position
        0,
        0,
        0, // Target position
        false, // Do not use transition (or set true for smooth transition)
      )
      // Don't do pointer on mobile
      return
    }

    cameraControls.current.setLookAt(
      0,
      0,
      8, // New camera position
      0,
      0,
      0, // Target position
      false, // Do not use transition (or set true for smooth transition)
    )

    const onPointerMove = (e: PointerEvent) => {
      const normalizedY = e.clientY / debouncedSize.width
      const newPolarAngle = MathUtils.lerp(MIN_POLAR_ANGLE_RAD, MAX_POLAR_ANGLE_RAD, normalizedY)
      const normalizedX = e.clientX / debouncedSize.width
      const newAzimuthAngle = MathUtils.lerp(MIN_AZIMUTH_ANGLE, MAX_AZIMUTH_ANGLE, normalizedX)
      targetPolarAngle.current.value = newPolarAngle
      targetAzimuthAngle.current.value = newAzimuthAngle

      // Update the CSS properties applied to the UI wrapperes
      // convert to degrees for CSS
      const targetPolarAngleDeg = MathUtils.radToDeg(newPolarAngle) / 10
      const targetAzimuthAngleDeg = MathUtils.radToDeg(newAzimuthAngle) / 10

      // Create a new transform string
      const azimuthDegString = `${targetAzimuthAngleDeg}deg`
      const polarDegString = `${targetPolarAngleDeg}deg`

      // Use the Typed OM if available
      if (document.documentElement.attributeStyleMap) {
        // CSSTyped OM currently doesn’t have a dedicated transform type, so we use CSSUnparsedValue
        const az = new CSSUnparsedValue([azimuthDegString])
        const pol = new CSSUnparsedValue([polarDegString])
        document.documentElement.attributeStyleMap.set('--ui-azimuth', az)
        document.documentElement.attributeStyleMap.set('--ui-polar', pol)
      } else {
        // Fallback for browsers that don’t support the Typed OM
        document.documentElement.style.setProperty('--ui-azumuth', azimuthDegString)
        document.documentElement.style.setProperty('--ui-polar', polarDegString)
      }
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
    <DreiCameraControls
      ref={cameraControls}
      minPolarAngle={MIN_POLAR_ANGLE_RAD}
      maxPolarAngle={MAX_POLAR_ANGLE_RAD}
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

export default CameraControls
