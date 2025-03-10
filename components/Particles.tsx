'use client'
import { useGSAP } from '@gsap/react'
import { useFrame, useThree } from '@react-three/fiber'
import { colorsFromRange, css } from '@thi.ng/color'
import gsap from 'gsap'
import React, { type FC, useMemo } from 'react'
import {
  array,
  clamp,
  color,
  float,
  Fn,
  hash,
  instancedArray,
  instanceIndex,
  mix,
  mod,
  mx_noise_float,
  positionLocal,
  positionWorld,
  select,
  sin,
  smoothstep,
  step,
  time,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl'
import { AdditiveBlending, WebGPURenderer } from 'three/webgpu'

import usePS5Store, { Stage } from '@/hooks/usePS5Store'

// Work on re-creating the PS5 Loading screen: https://www.youtube.com/watch?v=bMxgJbCgPQQ

const COLOUR_COUNT = 100

// Generate color palette
// https://www.npmjs.com/package/@thi.ng/color

const PALETTE = [
  ...colorsFromRange('soft', {
    base: 'sienna',
    num: COLOUR_COUNT * 0.1,
    variance: 0.05,
  }),
  ...colorsFromRange('cool', {
    base: 'darkgrey',
    num: COLOUR_COUNT * 0.2,
    variance: 0.2,
  }),
  ...colorsFromRange('neutral', {
    base: 'tan',
    num: COLOUR_COUNT * 0.7,
    variance: 0.02,
  }),
]

const colors = array(PALETTE.map((c) => color(css(c))))

const particleCount = Math.pow(60, 2)

const PS5Particles: FC = () => {
  const renderer = useThree((s) => s.gl) as unknown as WebGPURenderer

  const stage = usePS5Store((s) => s.stage)
  const setStage = usePS5Store((s) => s.setStage)

  const { key, positionNode, colorNode, scaleNode, opacityNode, updatePositions, uEnterValue } = useMemo(() => {
    // Create storage buffers for seeds and positions
    const seeds = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      seeds[i] = Math.random()
    }

    // Initialize particle positions (scattered across a box)
    const xSpacing = 0.01
    const waveLength = particleCount * xSpacing
    const xOffset = waveLength / 2
    const zRange = 12

    // uEnterValue still drives the transition from initial to target positions
    const uEnterValue = uniform(float(0.0))

    const seedBuffer = instancedArray(seeds, 'float')
    const initialPositionBuffer = instancedArray(particleCount, 'vec3')
    const finalPositionBuffer = instancedArray(particleCount, 'vec3')
    const currentPositionBuffer = instancedArray(particleCount, 'vec3')
    const colorBuffer = instancedArray(particleCount, 'vec3')

    const computePositions = Fn(() => {
      const seed = seedBuffer.element(instanceIndex)
      const s = seed.mul(2.0).sub(1).toVar()

      const finalPosition = finalPositionBuffer.element(instanceIndex)
      const t = float(instanceIndex.add(s)).mul(xSpacing)

      const noiseInputA = hash(instanceIndex.toVar().mul(10))
      const noiseInputB = hash(instanceIndex.toVar().add(2).mul(10).add(1))
      const noiseA = mx_noise_float(noiseInputA).toVar()
      const noiseB = mx_noise_float(noiseInputB).toVar()

      const x = t.sub(noiseA).sub(xOffset)
      const y = sin(t).add(noiseA.mul(4))
      const z = hash(instanceIndex)
        .mul(zRange)
        .sub(zRange / 2)
        .add(noiseB.mul(2))
      const wavePos = vec3(x, y, z).toVar()

      const shouldOffsetY = seed.lessThan(0.35)
      const offsetPos = vec3(0.0, noiseA.sub(noiseB).mul(24), 0.0).add(wavePos)
      const finalPos = select(shouldOffsetY, offsetPos, wavePos).toVar()

      finalPosition.assign(finalPos)

      // Compute initial position based on the final position
      const initialPosition = initialPositionBuffer.element(instanceIndex)
      const initialPos = finalPos.add(vec3(s.mul(6), s.mul(8), s.mul(12)))
      initialPosition.assign(initialPos)

      // Initialize the current position to the initial position
      const currentPosition = currentPositionBuffer.element(instanceIndex)
      currentPosition.assign(initialPos)
    })().compute(particleCount)

    const computeColor = Fn(() => {
      const seed = seedBuffer.element(instanceIndex)
      const c = colorBuffer.element(instanceIndex)
      const colorIndex = hash(instanceIndex.add(3)).mul(COLOUR_COUNT).floor()
      const randomColor = select(seed.greaterThan(0.99), color('#D7D5D1'), colors.element(colorIndex))
      c.assign(randomColor)
    })().compute(particleCount)

    renderer.computeAsync([computeColor, computePositions])

    // Instead of interpolating in positionNode we now simply return the current position.
    // @ts-expect-error missing type in library
    const positionNode = currentPositionBuffer.toAttribute()

    const colorNode = Fn(() => {
      const centeredUv = uv().distance(vec2(0.5))
      const posZ = positionWorld.z
      // Mimic a "bokeh" effect by creating soft circles near and far from the camera
      const softness = select(
        posZ.lessThan(0.0),
        smoothstep(-zRange / 2, 0.0, posZ).oneMinus(),
        select(posZ.greaterThan(1.0), smoothstep(1.0, 3.0, posZ), 0.0),
      )
      const sharpCircle = step(0.5, centeredUv).oneMinus()
      const softCircle = smoothstep(0.0, 0.5, centeredUv).oneMinus()
      const circle = mix(sharpCircle, softCircle, softness)
      const c = colorBuffer.element(instanceIndex)
      return vec4(c, circle)
    })()

    const opacityNode = Fn(() => {
      const seed = seedBuffer.element(instanceIndex)
      const offset = hash(seed)
      // Create a flickering effect by cycling the particles' opacity
      const period = float(mix(1.0, 8.0, seed))
      const tCycle = float(mod(time.add(offset.mul(period)), period))
      const flickerDuration = period.mul(0.3)
      const flickerIn = smoothstep(0.0, flickerDuration, tCycle)
      const flickerOut = smoothstep(period.sub(flickerDuration), period, tCycle).oneMinus()
      const flickerAlpha = flickerIn.mul(flickerOut)
      // Fade in as entering
      const enterOpacity = clamp(uEnterValue, 0.4, 1.0)
      // Fade particles out near and far from the camera
      const posZ = positionWorld.z
      const distanceOpacity = select(
        posZ.lessThan(0.0),
        smoothstep(-zRange / 2, 0.0, posZ).oneMinus(),
        select(posZ.greaterThan(1.0), smoothstep(1.0, 8.0, posZ), 0.0),
      ).oneMinus()

      const finalOpacity = flickerAlpha.mul(enterOpacity).mul(distanceOpacity)

      return finalOpacity
    })()

    const scaleNode = Fn(() => {
      const seed = seedBuffer.element(instanceIndex)
      const scale = select(
        seed.greaterThan(0.98),
        vec2(3.5),
        select(seed.lessThan(0.05), vec2(1.5), vec2(mix(0.5, 2.0, seed))),
      )
      return scale
    })()

    const key = colorNode.uuid

    // Update positions using a noise offset along the straight line.
    // Each particle will follow a unique, smooth noise curve from initial to final position.
    const updatePositions = Fn(() => {
      const seed = seedBuffer.element(instanceIndex)
      const initialPosition = initialPositionBuffer.element(instanceIndex)
      const finalPosition = finalPositionBuffer.element(instanceIndex)
      const currentPosition = currentPositionBuffer.element(instanceIndex)

      const t = time.mul(0.3)

      // Animate the final position so the particles float around.
      const s = seed.mul(2.0).sub(1) // convert seed to a value between -1 and 1
      const velX = mx_noise_float(t).mul(s).mul(0.01)
      const velY = sin(s.add(t)).mul(0.005)
      const velZ = mx_noise_float(finalPosition.add(1)).mul(0.01)
      finalPosition.addAssign(vec3(velX, velY, velZ))

      // Compute the base position as a straight-line interpolation from initial to final
      const position = mix(initialPosition, finalPosition, uEnterValue)

      // Set the current position to the base position plus the noise offset.
      currentPosition.assign(position)
    })().compute(particleCount)

    return {
      key,
      positionNode,
      colorNode,
      scaleNode,
      opacityNode,
      updatePositions,
      uEnterValue,
    }
  }, [renderer])

  useGSAP(
    () => {
      if (stage !== Stage.ENTER) return
      gsap.to(uEnterValue, {
        value: 1.0,
        duration: 3,
        ease: 'power2.inOut',
        onComplete: () => {
          setStage(Stage.BRAND)
        },
      })
    },
    {
      dependencies: [uEnterValue, stage],
    },
  )

  useGSAP(
    () => {
      if (stage !== Stage.RESTART) return
      gsap.to(uEnterValue, {
        value: 0.0,
        duration: 2,
        ease: 'power2.inOut',
        onComplete: () => {
          setStage(Stage.ENTER)
        },
      })
    },
    {
      dependencies: [uEnterValue, stage],
    },
  )

  useFrame(() => {
    renderer.compute(updatePositions)
  })

  return (
    <instancedMesh
      args={[undefined, undefined, particleCount]}
      frustumCulled={false}
      position={[0, -1.8, 0]}
      rotation={[0, 0.22, Math.PI / 12]}>
      <planeGeometry args={[0.1, 0.1]} />
      <spriteNodeMaterial
        key={key}
        positionNode={positionNode}
        colorNode={colorNode}
        scaleNode={scaleNode}
        opacityNode={opacityNode}
        blending={AdditiveBlending}
        depthWrite={false}
        transparent={true}
      />
    </instancedMesh>
  )
}

export default PS5Particles
