'use client'
import { offset, useClick, useDismiss, useFloating, useInteractions } from '@floating-ui/react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import SplitText from 'gsap/dist/SplitText'
import Image, { type StaticImageData } from 'next/image'
import React, { type FC, useRef, useState } from 'react'
import { SwitchTransition, Transition, TransitionStatus } from 'react-transition-group'

import arrowOutIcon from '@/assets/arrow-out.svg'
import avatarImg from '@/assets/avatar.jpg'
import optionsIcon from '@/assets/options.svg'
import brandIcon from '@/assets/p-brand.svg'
import restartIcon from '@/assets/restart.svg'
// import blogIcon from '@/assets/socials/article.svg'
import instagramIcon from '@/assets/socials/instagram.svg'
import linkedinIcon from '@/assets/socials/linkedin.svg'
import mailIcon from '@/assets/socials/mail.svg'
import youtubeIcon from '@/assets/socials/youtube.svg'
import usePS5Store, { Stage } from '@/hooks/usePS5Store'

// Register plugins
gsap.registerPlugin(useGSAP, SplitText)

const UI: FC = () => {
  const stage = usePS5Store((s) => s.stage)
  const wrapper = useRef<HTMLDivElement>(null)

  return (
    <SwitchTransition mode="in-out">
      <Transition key={stage} timeout={{ enter: 0, exit: 800 }} nodeRef={wrapper}>
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

export default UI

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
        const animateCircles = () => {
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
        }
        // Fade in the container and then start the circle animations
        gsap.fromTo(
          container.current,
          { opacity: 0, scale: 0.6 },
          { opacity: 1, duration: 0.5, scale: 1, delay: 1, ease: 'power1.in', onComplete: animateCircles },
        )
      }
      if (transitionStatus === 'exiting') {
        gsap
          .timeline()
          // First fade out the button and label
          .to(['button', 'span'], { opacity: 0, duration: 0.3 })
          // Then the container (inc. circles)
          .to(container.current, {
            opacity: 0,
            duration: 0.3,
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
        className="relative flex cursor-pointer items-center justify-center transition-transform duration-300 ease-in-out hover:scale-120"
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
        // Split the heading text (wrap in <div>) so characters can be animated in
        const splitHeading = new SplitText('h1', {
          charsClass: 'opacity-0 blur-sm',
        })

        gsap
          .timeline()
          // Transition the primary avatar circle from the brand logo scale to the full size
          .fromTo(
            '#avatar-circle',
            { opacity: 0, scale: 0.3 },
            { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' },
          )
          // // then bring the avatar image in
          .to('#avatar-img', { opacity: 1, duration: 0.4, ease: 'power2.in' }, 0.6)
          // followed by the secondary column
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
            '-=0.1',
          )
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
              stagger: 0.032,
              ease: 'power2.out',
            },
          )
          // Before the about paragraph
          .fromTo(
            '#about',
            {
              opacity: 0,
            },
            {
              opacity: 1,
              duration: 1.4,
              ease: 'power1.out',
            },
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
    middleware: [offset(16)],
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
      <header className="col-span-3 flex flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-4xl font-medium tracking-tight">PS5 Landing Experience with WebGPU</h1>
        <p id="about" className="max-w-xl leading-relaxed font-light text-white/80">
          This project was inspired by the PS5 loading screen, and is built with Next.js, React Three Fiber, GSAP and
          TailwindCSS. All of the shader/GPU logic for the particles is written entirely in Typescript using Three.js
          Shading Language.
        </p>
      </header>

      {/* "See the code" column */}
      <div id="see" className="row-span-2 grid grid-rows-subgrid">
        <a
          href={CODE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex size-48 cursor-pointer items-center justify-center place-self-center rounded-full bg-white/10 transition-colors hover:bg-white/20">
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
            priority={true}
          />
        </div>

        <div className="flex w-full flex-col items-center justify-between pb-8">
          <div className="space-y-3">
            <h3 className="mt-2 text-center text-2xl font-light tracking-tight">Matthew Frawley</h3>
            <button
              ref={refs.setReference}
              {...getReferenceProps()}
              className="group mx-auto flex cursor-pointer items-center gap-2 p-1 select-none">
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
                className="bg-darkblue/80 fixed z-50 flex flex-wrap gap-4 rounded-lg p-4 opacity-0">
                {SOCIALS.map((social, index) => (
                  <a key={index} href={social.href} target="_blank" rel="noopener noreferrer p-2">
                    <Image src={social.icon} alt={social.alt} className="size-8" />
                  </a>
                ))}
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

const SOCIALS: {
  icon: StaticImageData
  alt: string
  href: string
}[] = [
  { icon: linkedinIcon, alt: 'LinkedIn', href: 'https://www.linkedin.com/in/matthewjfrawley/' },
  { icon: youtubeIcon, alt: 'YouTube', href: 'https://www.youtube.com/@pragmattic-dev' },
  { icon: instagramIcon, alt: 'Instagram', href: 'https://www.instagram.com/prag.matt.ic/' },
  { icon: mailIcon, alt: 'Email', href: 'mailto:pragmattic.ltd@gmail.com' },
  // { icon: blogIcon, alt: 'Blog', href: 'https://blog.pragmattic.dev' },
] as const

const CODE_URL = 'https://github.com/prag-matt-ic/pragmattic-ps5'
