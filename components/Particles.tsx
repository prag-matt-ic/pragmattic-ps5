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

import useAudio from '@/hooks/useAudio'
import useStageStore, { Stage } from '@/hooks/useStageStore'

// Generate color palette
// https://www.npmjs.com/package/@thi.ng/color

const COLOUR_COUNT = 100

const PALETTE = [
  ...colorsFromRange('soft', {
    base: 'sienna',
    num: COLOUR_COUNT * 0.25,
    variance: 0.05,
  }),
  ...colorsFromRange('neutral', {
    base: 'tan',
    num: COLOUR_COUNT * 0.75,
    variance: 0.03,
  }),
]

const colors = array(PALETTE.map((c) => color(css(c))))

const PARTICLE_COUNT = Math.pow(56, 2)

const Particles: FC = () => {
  const renderer = useThree((s) => s.gl) as unknown as WebGPURenderer
  const stage = useStageStore((s) => s.stage)
  const setStage = useStageStore((s) => s.setStage)
  const { playAudio: playWhoosh } = useAudio({ src: '/sounds/whoosh.aac', loop: false })

  const { key, positionNode, colorNode, scaleNode, opacityNode, updatePositions, uEnterValue } = useMemo(() => {
    // Create storage buffers for seeds and positions
    const seeds = new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      seeds[i] = Math.random()
    }

    // Initialize particle positions (scattered across a box)
    const xSpacing = 0.01
    const waveLength = PARTICLE_COUNT * xSpacing
    const xOffset = waveLength / 2
    const zRange = 12

    // uEnterValue drives the transition from initial to target positions
    const uEnterValue = uniform(float(0.0))

    const seedBuffer = instancedArray(seeds, 'float')
    const initialPositionBuffer = instancedArray(PARTICLE_COUNT, 'vec3')
    const finalPositionBuffer = instancedArray(PARTICLE_COUNT, 'vec3')
    const currentPositionBuffer = instancedArray(PARTICLE_COUNT, 'vec3')
    const colorBuffer = instancedArray(PARTICLE_COUNT, 'vec3')

    const computePositions = Fn(() => {
      const seed = seedBuffer.element(instanceIndex)
      const s = seed.mul(2.0).sub(1).toVar()

      const finalPosition = finalPositionBuffer.element(instanceIndex)
      const t = float(instanceIndex).mul(xSpacing)

      const noiseInputA = hash(instanceIndex.toVar().mul(10))
      const noiseInputB = hash(seed.add(1).mul(20))
      const noiseA = mx_noise_float(noiseInputA).toVar()
      const noiseB = mx_noise_float(noiseInputB).toVar()

      // Create a wave pattern
      const x = t.sub(noiseA).sub(xOffset)
      const y = sin(t.div(2)).mul(2.2).add(s).sub(noiseB)
      const z = hash(instanceIndex)
        .mul(zRange)
        .sub(zRange / 2)
        .add(noiseB.mul(2))
      const wavePos = vec3(x, y, z).toVar()

      // Offset a selection of wave particles along the Y axis
      const shouldOffsetY = seed.lessThan(0.3)
      const offsetPos = vec3(0.0, noiseA.sub(noiseB).mul(24), 0.0).add(wavePos)

      // Randomize the position of some particles within a box
      const shouldRandomlyPlace = seed.greaterThan(0.6).and(seed.lessThan(0.7))
      const randomPos = vec3(
        hash(instanceIndex.sub(1))
          .mul(waveLength)
          .sub(waveLength / 2),
        noiseInputA.mul(2).sub(1).mul(10),
        hash(seed.add(instanceIndex)).mul(2).sub(1).mul(zRange),
      )

      const finalPos = select(shouldOffsetY, offsetPos, select(shouldRandomlyPlace, randomPos, wavePos)).toVar()
      finalPosition.assign(finalPos)

      // Compute initial position based on the final position
      const initialPosition = initialPositionBuffer.element(instanceIndex)
      const initialPos = finalPos.add(vec3(s.mul(8), s.mul(6).add(noiseA), seed.mul(32)))
      initialPosition.assign(initialPos)

      // Initialize current position to the initial position
      const currentPosition = currentPositionBuffer.element(instanceIndex)
      // currentPosition.assign(initialPos)
      currentPosition.assign(finalPos)
    })().compute(PARTICLE_COUNT)

    const computeColor = Fn(() => {
      const seed = seedBuffer.element(instanceIndex)
      const c = colorBuffer.element(instanceIndex)
      const colorIndex = hash(instanceIndex.add(3)).mul(COLOUR_COUNT).floor()
      const randomColor = select(seed.greaterThan(0.99), color('#D7D5D1'), colors.element(colorIndex))
      c.assign(randomColor)
    })().compute(PARTICLE_COUNT)

    renderer.computeAsync([computeColor, computePositions])

    // @ts-expect-error missing type in library
    const positionNode = currentPositionBuffer.toAttribute()

    const colorNode = Fn(() => {
      const centeredUv = uv().distance(vec2(0.5))
      const posZ = positionWorld.z
      // Mimic a "bokeh" effect by creating soft circles near and far from the camera
      const softness = select(
        posZ.lessThan(0.0),
        smoothstep(-zRange / 2, 0.0, posZ).oneMinus(),
        select(posZ.greaterThan(0.5), smoothstep(0.5, 2.5, posZ), 0.0),
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
      const period = float(mix(1.0, 10.0, seed))
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
        posZ.lessThan(1.0),
        smoothstep(-zRange / 2, 1.0, posZ).oneMinus(),
        select(posZ.greaterThan(1.0), smoothstep(1.0, 10.0, posZ), 0.0),
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
      // Add custom size attenuation based on the Z position
      const posZ = positionWorld.z
      const attenuation = smoothstep(-zRange / 2, zRange / 2, posZ)
        .clamp(0.3, 1.0)
        .mul(2)

      return scale.mul(attenuation)
    })()

    const key = colorNode.uuid

    const updatePositions = Fn(() => {
      const seed = seedBuffer.element(instanceIndex)
      const initialPosition = initialPositionBuffer.element(instanceIndex)
      const finalPosition = finalPositionBuffer.element(instanceIndex)
      const currentPosition = currentPositionBuffer.element(instanceIndex)

      const t = time.mul(0.3)

      // Animate the final position to make the particles float around
      const s = seed.mul(2.0).sub(1) // convert seed to a value between -1 and 1
      const velX = mx_noise_float(t).mul(s).mul(0.01)
      const velY = sin(s.add(t)).mul(0.006)
      const velZ = mx_noise_float(currentPosition.add(1)).mul(0.01)
      finalPosition.addAssign(vec3(velX, velY, velZ))
      initialPosition.addAssign(vec3(velX, velY, velZ))

      // Move from initial to final position during enter transition
      const position = mix(initialPosition, finalPosition, uEnterValue).toVar()

      // Set the current position to the base position plus the noise offset.
      currentPosition.assign(position)
    })().compute(PARTICLE_COUNT)

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
        duration: 2.5,
        ease: 'power3.inOut',
        onStart: () => {
          setTimeout(playWhoosh, 500)
        },
        onComplete: () => {
          setStage(Stage.LOGO)
        },
      })
    },
    {
      dependencies: [uEnterValue, stage],
    },
  )

  useGSAP(
    () => {
      if (stage !== Stage.PREFERENCES) return
      gsap.to(uEnterValue, {
        value: 0.0,
        duration: 1,
        ease: 'power2.inOut',
      })
    },
    {
      dependencies: [uEnterValue, stage],
    },
  )

  useFrame(() => {
    // renderer.compute(updatePositions)
  })

  return (
    <instancedMesh
      args={[undefined, undefined, PARTICLE_COUNT]}
      frustumCulled={false}
      position={[0, -2.5, 0]}
      rotation={[0, 0.3, Math.PI / 12]}>
      <planeGeometry args={[0.1, 0.1]} />
      <spriteNodeMaterial
        key={key}
        positionNode={positionNode}
        // colorNode={colorNode}
        scaleNode={scaleNode}
        // opacityNode={opacityNode}
        // blending={AdditiveBlending}
        depthWrite={false}
        transparent={true}
      />
    </instancedMesh>
  )
}

export default Particles
