'use client'
import { offset, useClick, useDismiss, useFloating, useInteractions } from '@floating-ui/react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Image from 'next/image'
import React, { type FC, useRef, useState } from 'react'
import { SwitchTransition, Transition, TransitionStatus } from 'react-transition-group'

import arrowOutIcon from '@/assets/arrow-out.svg'
import avatarImg from '@/assets/avatar.jpg'
import optionsIcon from '@/assets/options.svg'
import brandIcon from '@/assets/p-brand.svg'
import restartIcon from '@/assets/restart.svg'

import usePS5Store, { Stage } from '@/hooks/usePS5Store'
import SplitText from 'gsap/dist/SplitText'

const PS5UI: FC = () => {
  const stage = usePS5Store((s) => s.stage)
  const wrapper = useRef<HTMLDivElement>(null)

  return (
    <SwitchTransition mode="in-out">
      <Transition key={stage} timeout={{ enter: 0, exit: 1000 }} nodeRef={wrapper}>
        {(transitionStatus) => {
          return (
            <div ref={wrapper} className="fixed inset-0 flex items-center justify-center">
              {stage === Stage.BRAND && <PulsingBrand transitionStatus={transitionStatus} />}
              {stage === Stage.AVATAR && <Avatars transitionStatus={transitionStatus} />}
            </div>
          )
        }}
      </Transition>
    </SwitchTransition>
  )
}

export default PS5UI

type Props = {
  transitionStatus: TransitionStatus
}

const PulsingBrand: FC<Props> = ({ transitionStatus }) => {
  const setStage = usePS5Store((s) => s.setStage)
  const circleTweens = useRef<gsap.core.Tween[]>([])
  const container = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (transitionStatus === 'entered') {
        const circles: HTMLDivElement[] = gsap.utils.toArray('.circle-pulse')
        // Mapped rather than using selector so that the delay and duration can be set per circle.
        circleTweens.current = circles.map((circle, index) => {
          return gsap.to(circle, {
            keyframes: {
              '0%': { opacity: 0, scale: 1, ease: 'none' },
              '25%': { opacity: 0.3, scale: 1.25, ease: 'none' },
              '75%': { opacity: 1, scale: 1.75, ease: 'none' },
              '100%': { opacity: 0, scale: 2, ease: 'none' },
            },
            duration: 1.5,
            repeat: -1,
            repeatDelay: 0.5,
            delay: index / 1.5,
          })
        })
        // Fade in the container
        gsap.fromTo(
          container.current,
          { opacity: 0, scale: 0.6 },
          { opacity: 1, duration: 0.5, scale: 1, ease: 'power1.in' },
        )
      }
      if (transitionStatus === 'exiting') {
        gsap
          .timeline()
          // First fade out the button and label
          .to(['button', 'span'], { opacity: 0, duration: 0.3 })
          // Then the container (circles)
          .to(container.current, {
            opacity: 0,
            duration: 0.4,
            onComplete: () => {
              circleTweens.current.forEach((tween) => tween.kill())
            },
          })
      }
    },
    { dependencies: [transitionStatus], scope: container },
  )

  return (
    <div ref={container} className="relative flex items-center justify-center opacity-0">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="circle-pulse absolute aspect-square size-24 rounded-full border-[1.5px] border-white opacity-0"
          style={{
            boxShadow: '0 0 6px 2px rgba(255, 255, 255, 0.25), inset 0 0 6px 2px rgba(255, 255, 255, 0.2)',
          }}
        />
      ))}
      <button
        id="brand-button"
        className="relative flex cursor-pointer items-center justify-center transition-transform duration-300 ease-in-out hover:scale-125"
        aria-label="Press to start"
        onClick={() => setStage(Stage.AVATAR)}>
        <Image src={brandIcon} alt="Pragmattic" className="size-24" />
      </button>

      <span className="absolute -bottom-24 text-center text-sm font-light text-white/80 select-none">
        Press to enter
      </span>
    </div>
  )
}

const Avatars: FC<Props> = ({ transitionStatus }) => {
  const setStage = usePS5Store((s) => s.setStage)
  const container = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (transitionStatus === 'entering') {
        // Split the heading text (wrap in <divs> with classname)
        const splitHeading = new SplitText('h1', {
          charsClass: 'opacity-0 blur-sm',
        })
        gsap
          .timeline()
          // Transition the avatar circle from the brand logo scale to the full size
          .fromTo(
            '#avatar-circle',
            { opacity: 0, scale: 0.3 },
            { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' },
          )
          // then bring the avatar image in
          .to('#avatar-img', { opacity: 1, duration: 0.4, ease: 'power2.in' }, 0.4)
          // followed by the secondary column and then header
          .fromTo(
            '#see',
            { opacity: 0, scale: 0.7, xPercent: 16 },
            {
              opacity: 1,
              scale: 1,
              xPercent: 0,
              duration: 0.25,
              ease: 'power1.in',
            },
            '-=0.15',
          )
          // Header is initially hidden to prevent flash of content before split text is run
          // So we show it before animating the characters in...
          .set('header', { opacity: 1 })
          // Then we animate the H1 characters in
          .fromTo(
            splitHeading.chars,
            { opacity: 0 },
            {
              keyframes: [
                { opacity: 0.6, filter: 'blur(4px)', ease: 'power1.out' },
                { opacity: 1, filter: 'blur(0px)', ease: 'power1.out' },
              ],
              duration: 0.6,
              stagger: 0.024,
              ease: 'power2.out',
            },
            0,
          )
          // Before the about paragraph
          .fromTo(
            '#about',
            {
              opacity: 0,
              y: 8,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: 'power2.out',
            },
            0.5,
          )
      }

      if (transitionStatus === 'exiting') {
        gsap.to(container.current, {
          opacity: 0,
          duration: 0.4,
          ease: 'power1.out',
        })
      }
    },
    { dependencies: [transitionStatus], scope: container },
  )

  // Contact menu logic

  const { contextSafe } = useGSAP({ scope: container })
  const [showContactMenu, setShowContactMenu] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    strategy: 'fixed',
    transform: false,
    open: showContactMenu,
    onOpenChange: setShowContactMenu,
    middleware: [offset(12)],
  })

  const click = useClick(context, { toggle: true })
  const dismiss = useDismiss(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss])

  const onContactMenuEnter = contextSafe(() => {
    gsap.fromTo('#contact-menu', { opacity: 0, y: -8, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.4 })
  })

  const onContactMenuExit = contextSafe(() => {
    gsap.to('#contact-menu', { opacity: 0, y: -8, scale: 0.9, duration: 0.2 })
  })

  const onRestartPress = () => {
    setStage(Stage.RESTART)
  }

  return (
    <section
      ref={container}
      className="absolute grid h-full grid-cols-3 grid-rows-3 place-content-center gap-x-6 gap-y-3">
      <header className="col-span-3 flex flex-col items-center justify-center gap-4 text-center opacity-0">
        <h1 className="text-4xl font-medium tracking-tight">PS5 Landing Experience</h1>
        <p id="about" className="max-w-xl leading-relaxed font-light text-white/80">
          This project was inspired by the PS5 loading screen, and is built using React (Next.js), Three.js (R3F), GSAP
          and TailwindCSS. All of the shader/GPU logic is written entirely in Typescript using Three.js Shading
          Language.
        </p>
      </header>

      {/* See how its done column */}
      <div id="see" className="row-span-2 grid grid-rows-subgrid">
        <a
          href={CODE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex size-48 cursor-pointer items-center justify-center place-self-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20">
          <Image
            src={arrowOutIcon}
            alt="add"
            className="size-14 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1"
          />
        </a>
        <h3 className="mt-2 text-center text-2xl font-light tracking-tight">See the code</h3>
      </div>

      {/* Profile column */}
      <div className="relative row-span-2 grid grid-rows-subgrid">
        <div
          id="avatar-circle"
          className="aspect-square size-72 place-self-center rounded-full border-[1.5px] border-white p-2.5 opacity-0"
          style={{
            boxShadow: '0 0 6px 2px rgba(255, 255, 255, 0.25), inset 0 0 6px 2px rgba(255, 255, 255, 0.2)',
          }}>
          <Image
            src={avatarImg}
            id="avatar-img"
            alt="Matthew Frawley"
            className="rounded-full opacity-0"
            quality={85}
            priority={true}
          />
        </div>

        <div className="flex w-full flex-col items-center justify-between pb-8">
          <div className="space-y-3">
            <h3 className="mt-2 text-center text-2xl font-light tracking-tight">Matthew Frawley</h3>
            <button
              ref={refs.setReference}
              {...getReferenceProps()}
              className="group mx-auto flex cursor-pointer items-center gap-2">
              <Image src={optionsIcon} alt="options" className="h-5 w-fit" />
              <span className="text-left text-sm font-light text-white/80 group-hover:text-white">Options</span>
            </button>

            {/* Contact options */}
            <Transition
              in={showContactMenu}
              timeout={{ enter: 0, exit: 300 }}
              mountOnEnter={true}
              unmountOnExit={true}
              nodeRef={refs.floating}
              onEnter={onContactMenuEnter}
              onExit={onContactMenuExit}>
              <div
                ref={refs.setFloating}
                style={floatingStyles}
                {...getFloatingProps()}
                id="contact-menu"
                className="fixed z-50 rounded-lg bg-white p-6 opacity-0">
                <h3>Contact Matt</h3>
              </div>
            </Transition>
          </div>

          <button
            className="cursor-pointer rounded-full bg-white/10 p-3 align-bottom hover:bg-white/20"
            onClick={onRestartPress}>
            <Image src={restartIcon} alt="plus" className="size-8" />
          </button>
        </div>
      </div>
    </section>
  )
}

const CODE_URL = ''
