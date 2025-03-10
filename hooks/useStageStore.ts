'use client'
import { create } from 'zustand'

export enum Stage {
  PREFERENCES = 'preferences',
  ENTER = 'enter',
  LOGO = 'logo',
  AVATAR = 'avatar',
}

type Store = {
  stage: Stage
  setStage: (stage: Stage) => void
}

const useStageStore = create<Store>((set) => ({
  stage: Stage.ENTER,
  setStage: (stage) => set({ stage }),
}))

export default useStageStore
