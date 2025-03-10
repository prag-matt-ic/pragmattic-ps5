import Scene from '@/components/Scene'
import UI from '@/components/UI'

export default function PS5LandingPage() {
  return (
    <main className="bg-darkblue h-lvh w-full overflow-hidden text-white">
      <Scene />
      {/* <UI /> */}
    </main>
  )
}

// -- Guide to building the PS5 Landing Page --
// here's a step by step of how I built this using next.js and react-three-fiber

// 1. Create particles using instanced sprite (positioned on sine wave with noise for offsets)

// 2. Scale node to add size variation and a custom size attenuation

// 3. Color node for random theme colours and add a bokeh effect

// 4. Opacity node for flickering effect and fade in/out based on distance from the camera

// 5. Zustand store to track the current stage of the experience
// animate the particles from the starting point to the final position, and then move them about

// 6. Backdrop for catching light

// 7. Directional light

// 8. Camera controls which use the pointer position to move the camera

// UI

// 9. Prepare the assets in Figma

// 10. Setup a Switch Transition to toggle between the different stages

// 11. Add the logo and pulsing circles

// 12. Add the avatar and info sections

// 13. Attach a floating menu to the contact options button

// 14. Audio with preferences
