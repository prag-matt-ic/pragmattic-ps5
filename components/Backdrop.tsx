import { Backdrop } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import React, { type FC, useMemo } from 'react'
import { color, mix, uv } from 'three/tsl'

const PS5Backdrop: FC = () => {
  const viewport = useThree((s) => s.viewport)

  const { colorNode } = useMemo(() => {
    const lightColor = color('#12141F')
    // const lightColor = color("red");
    const darkColor = color('#090A12')
    const colorNode = mix(lightColor, darkColor, uv().y)
    return { colorNode }
  }, [])

  return (
    <Backdrop
      floor={0.3} // Stretches the floor segment, 0.25 by default
      segments={20} // Mesh-resolution, 20 by default
      receiveShadow={true}
      scale={[110, 40, 8]}
      position={[0, -viewport.height / 3, -1]}>
      <meshStandardNodeMaterial colorNode={colorNode} />
    </Backdrop>
  )
}

export default PS5Backdrop
