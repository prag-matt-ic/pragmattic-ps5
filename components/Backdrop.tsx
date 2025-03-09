import { Backdrop } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import React, { type FC, useMemo } from 'react'
import { color, mix, uv } from 'three/tsl'

const PS5Backdrop: FC = () => {
  const viewport = useThree((s) => s.viewport)

  const { colorNode } = useMemo(() => {
    const topColour = color('#12141F')
    const bottomColour = color('#090A12')
    const colorNode = mix(topColour, bottomColour, uv().y)
    return { colorNode }
  }, [])

  return (
    <Backdrop
      floor={0.3} // Stretches the floor segment, 0.25 by default
      segments={18} // Mesh-resolution, 20 by default
      receiveShadow={false}
      scale={[160, 52, 16]}
      position={[0, -viewport.height / 3, -5]}>
      <meshStandardNodeMaterial colorNode={colorNode} />
    </Backdrop>
  )
}

export default PS5Backdrop
