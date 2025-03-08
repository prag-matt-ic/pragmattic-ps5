'use client'
import { useGSAP } from '@gsap/react'
import { useFrame, useThree } from '@react-three/fiber'
import { colorsFromRange, css } from '@thi.ng/color'
import gsap from 'gsap'
import { useControls } from 'leva'
import React, { type FC, useLayoutEffect, useMemo } from 'react'
import { mx_noise_vec3, smoothstep } from 'three/src/nodes/TSL.js'
import {
  array,
  atan,
  clamp,
  color,
  cos,
  deltaTime,
  float,
  Fn,
  hash,
  If,
  instancedArray,
  instanceIndex,
  mix,
  mod,
  mx_fractal_noise_vec3,
  mx_noise_float,
  PI,
  PI2,
  positionLocal,
  positionWorld,
  select,
  sin,
  time,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl'
import { AdditiveBlending, WebGPURenderer } from 'three/webgpu'

import usePS5Store, { Stage } from '../hooks/usePS5Store'

// Work on re-creating the PS5 Loading screen: https://www.youtube.com/watch?v=bMxgJbCgPQQ

const colourCount = 100

const rangeColors = [
  ...colorsFromRange('soft', {
    base: 'sienna',
    num: colourCount * 0.1,
    variance: 0.05,
  }),
  ...colorsFromRange('neutral', {
    base: 'tan',
    num: colourCount * 0.7,
    variance: 0.02,
  }),
  ...colorsFromRange('dark', {
    base: 'darkgrey',
    num: colourCount * 0.2,
    variance: 0.5,
  }),
]

const colors = array(rangeColors.map((c) => color(css(c))))

const particleCount = Math.pow(64, 2)

// Setup buffers
// Set initial positions
// Add colours
// Add fade in and fade out
// Update positions

const PS5Particles: FC = () => {
  const renderer = useThree((s) => s.gl) as unknown as WebGPURenderer
  const viewport = useThree((s) => s.viewport)

  const stage = usePS5Store((s) => s.stage)
  const setStage = usePS5Store((s) => s.setStage)

  // console.log("viewport", viewport.width, viewport.width / particleCount);

  const { key, positionNode, colorNode, scaleNode, opacityNode, updatePositions, uEnterValue } = useMemo(() => {
    // Create storage buffers for positions (w holds random seed) and velocities.
    const seeds = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      seeds[i] = Math.random()
    }

    // Initialize particle positions
    const xSpacing = 0.01
    const waveLength = particleCount * xSpacing
    const xOffset = waveLength / 2
    const zRange = 12

    // spread across a box
    const scatteredPositions = new Float32Array(particleCount * 3)
    const width = waveLength
    const height = 10
    const depth = zRange

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width - width / 2
      const y = Math.random() * height - height / 2
      const z = Math.random() * depth
      scatteredPositions.set([x, y, z], i * 3)
      // scatteredPositions.set([0, 0, 0], i * 3);
    }

    const uEnterValue = uniform(float(0.0))

    const seedBuffer = instancedArray(seeds, 'float')
    const initialPositionBuffer = instancedArray(scatteredPositions, 'vec3')
    const finalPositionBuffer = instancedArray(particleCount, 'vec3')
    const colorBuffer = instancedArray(particleCount, 'vec3')

    const computeInit = Fn(() => {
      const seed = seedBuffer.element(instanceIndex)

      // Calculation final position
      const position = finalPositionBuffer.element(instanceIndex)
      // Use the instanceIndex to compute a parameter "t"
      // Multiply by a spacing factor (0.1 here) to spread out the points
      const t = float(instanceIndex.add(3)).mul(xSpacing)

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

      // Compute x as the parameter t, and y as the sine of t scaled by the amplitude.
      // You can leave z at 0 if you want a 2D sine wave.
      const wavePos = vec3(x, y, z).toVar()

      // Randomly leave some of the particles at their initial position
      const makeMoreRandom = seed.lessThan(0.3)
      const randomPos = vec3(0.0, noiseA.sub(noiseB).mul(24), 0.0).add(wavePos)

      const finalPosition = select(makeMoreRandom, randomPos, wavePos)

      position.assign(finalPosition)

      // Initiate Colour
      const c = colorBuffer.element(instanceIndex)
      const colorIndex = hash(instanceIndex.add(3)).mul(colourCount).floor()
      const randomColor = select(seed.greaterThan(0.98), color('#BBBCB5'), colors.element(colorIndex))

      c.assign(randomColor)
    })().compute(particleCount)

    renderer.computeAsync(computeInit)

    // Nodes for sprite node material
    const positionNode = Fn(() => {
      // const initialPosition = initialPositionBuffer.element(instanceIndex);
      // const finalPosition = finalPositionBuffer.element(instanceIndex);
      const finalPosition = finalPositionBuffer.toAttribute()
      const initialPosition = initialPositionBuffer.toAttribute()
      const position = mix(initialPosition, finalPosition, uEnterValue)
      return position
    })()

    const colorNode = Fn(() => {
      // Compute the distance from the center of the UV (0.5, 0.5)
      const centeredUv = uv().distance(vec2(0.5)).toVar()
      // const posZ = positionLocal.z;
      const posZ = positionWorld.z

      // Mimic a "bokeh" effect by softening the edges of the circle at varying distances
      // The Z position of particles ranges from -5 to 5
      // We'll focus circles (sharp edges) at a range of 0 - 1.
      const softness = select(
        posZ.lessThan(0.0),
        // Invert the mapping: at posZ = -5, smoothstep(-5,0,-5) returns 0, so 1 - 0 = 1 (fully soft);
        // at posZ = 0, smoothstep(-5,0,0) returns 1, so 1 - 1 = 0 (sharp)
        smoothstep(-5.0, 0.0, posZ).oneMinus(),
        select(
          posZ.greaterThan(1.0),
          // For Z from 1 (sharp) to 5 (soft)
          smoothstep(1.0, 5.0, posZ),
          // For Z between 0 and 1, no softness (fully sharp)
          0.0,
        ),
      )
      // Define a sharp circle: a narrow transition (e.g., from 0.45 to 0.5)
      const sharpCircle = smoothstep(0.49, 0.5, centeredUv).oneMinus()
      // Define a soft circle: a wider transition (e.g., from 0.25 to 0.5)
      const softCircle = smoothstep(0.0, 0.5, centeredUv).oneMinus()
      // Blend between the two based on the softness factor
      const circle = mix(sharpCircle, softCircle, softness)

      // Fade out in the background
      const fadeOut = smoothstep(zRange / 2, zRange / 2 + 1, posZ).oneMinus()
      const alpha = circle.mul(fadeOut).mul(0.5)

      const c = colorBuffer.element(instanceIndex)

      return vec4(c, alpha)
    })()

    const opacityNode = Fn(() => {
      // Use the seed to generate a fade-in fade-out effect over time
      const seed = seedBuffer.element(instanceIndex)
      const offset = hash(seed)
      const period = float(mix(1.0, 8.0, seed))
      const tCycle = float(mod(time.add(offset.mul(period)), period))
      const fadeDuration = period.mul(0.3)
      const fadeIn = smoothstep(0.0, fadeDuration, tCycle)
      const fadeOut = smoothstep(period.sub(fadeDuration), period, tCycle).oneMinus()

      const flickerAlpha = fadeIn.mul(fadeOut)
      const enterOpacity = clamp(uEnterValue, 0.2, 1.0)

      const finalOpacity = flickerAlpha.mul(enterOpacity)
      return finalOpacity
    })()

    const scaleNode = Fn(() => {
      const seed = seedBuffer.element(instanceIndex)
      // Use the seed to randomise the scale of each particle
      // Making a small percentage of them larger
      const scale = select(seed.greaterThan(0.98), vec2(3.5), vec2(mix(0.4, 2.0, seed)))

      return scale
    })()

    const key = colorNode.uuid

    const updatePositions = Fn(() => {
      // Slowly move the particles around
      const seed = seedBuffer.element(instanceIndex)
      const finalPosition = finalPositionBuffer.element(instanceIndex)

      const s = seed.toVar().mul(2.0).min(1.0)
      const t = time.mul(0.3)
      const velX = mx_noise_float(s.add(t)).mul(0.003)
      const velY = mx_noise_float(sin(s.mul(t))).mul(0.003)
      const velZ = mx_noise_float(finalPosition.add(1)).mul(0.003)
      finalPosition.addAssign(vec3(velX, velY, velZ))

      // Move from the initial position to the final position over time
      // const transitionValue = smoothstep(0.0, transitionInDuration, time);
      // const initialPosition = initialPositionBuffer.element(instanceIndex);
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
        duration: 1,
        ease: 'power2.in',
        delay: 0.5,
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
        duration: 1,
        ease: 'power3.out',
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
      position={[0, -1.5, 0]}
      rotation={[0, 0.2, Math.PI / 12]}>
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
