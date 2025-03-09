import dynamic from 'next/dynamic'

import UI from '@/components/UI'
const Scene = dynamic(() => import('@/components/Scene'))

export default function PS5LoadingPage() {
  return (
    <main className="h-lvh w-full overflow-hidden bg-black text-white">
      <Scene />
      <UI />
    </main>
  )
}
