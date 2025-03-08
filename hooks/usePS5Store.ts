"use client";
import { create } from "zustand";

export enum Stage {
  RESTART = "restart",
  ENTER = "enter",
  BRAND = "brand",
  AVATAR = "avatar",
}

type Store = {
  stage: Stage;
  setStage: (stage: Stage) => void;
};

const usePS5Store = create<Store>((set, get) => ({
  stage: Stage.ENTER,
  setStage: (stage) => set({ stage }),
}));

export default usePS5Store;
