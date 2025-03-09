import dynamic from 'next/dynamic'

import UI from '@/components/UI'
const PS5LoadingScene = dynamic(() => import('@/components/Scene'))

export default function PS5LoadingPage() {
  return (
    <main className="h-lvh w-full overflow-hidden bg-black text-white">
      <PS5LoadingScene />
      <UI />
    </main>
  )
}
