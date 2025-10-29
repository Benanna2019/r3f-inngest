import { Canvas } from '@react-three/fiber'
import { OrbitControls, CameraShake } from '@react-three/drei'
import { useEffect, useState, useRef } from 'react'
// import { useControls } from 'leva'
import { Particles } from './Particles'

export type AnimationState = 'idle' | 'processing' | 'streaming' | 'complete'

interface AnimationConfig {
  focus: number
  speed: number
  aperture: number
  fov: number
  curl: number
}

const ANIMATION_PRESETS: Record<AnimationState, AnimationConfig> = {
  idle: {
    focus: 9.5,
    speed: 6.9,
    aperture: 3.6,
    fov: 14,
    curl: 0.30, // Default state
  },
  processing: {
    focus: 9.4,
    speed: 7.2,
    aperture: 3.5,
    fov: 14.5,
    curl: 0.32, // Very subtle increase, thinking
  },
  streaming: {
    focus: 9.3,
    speed: 7.5,
    aperture: 3.4,
    fov: 15,
    curl: 0.35, // Slightly more active, responding
  },
  complete: {
    focus: 9.5,
    speed: 6.9,
    aperture: 3.6,
    fov: 14,
    curl: 0.30, // Return to default
  },
}

interface AnimatedSentienceProps {
  animationState: AnimationState
  className?: string
  style?: React.CSSProperties
}

function Scene({ config }: { config: AnimationConfig }) {
  return (
    <>
      <OrbitControls makeDefault autoRotate autoRotateSpeed={0.2} zoomSpeed={0.1} enableZoom={false} />
      <CameraShake 
        yawFrequency={1} 
        maxYaw={0.05} 
        pitchFrequency={1} 
        maxPitch={0.05} 
        rollFrequency={0.5} 
        maxRoll={0.5} 
        intensity={0.2} 
      />
      <Particles {...config} size={512} />
    </>
  )
}

export function AnimatedSentience({ 
  animationState, 
  className,
  style 
}: AnimatedSentienceProps) {
  const [currentConfig, setCurrentConfig] = useState<AnimationConfig>(
    ANIMATION_PRESETS.idle
  )
  const previousStateRef = useRef<AnimationState>('idle')
  const [pulsateOffset, setPulsateOffset] = useState(0)

  // Manual controls disabled for production
  const manualControls = {
    useManual: false,
    focus: 9.5,
    speed: 6.9,
    aperture: 3.6,
    fov: 14,
    curl: 0.30
  }

  // Handle manual controls separately
  useEffect(() => {
    if (manualControls.useManual) {
      setCurrentConfig({
        focus: manualControls.focus,
        speed: manualControls.speed,
        aperture: manualControls.aperture,
        fov: manualControls.fov,
        curl: manualControls.curl,
      })
    }
  }, [manualControls.useManual, manualControls.focus, manualControls.speed, manualControls.aperture, manualControls.fov, manualControls.curl])

  // Smoothly transition to new animation state
  useEffect(() => {
    // Skip animation if using manual controls
    if (manualControls.useManual) {
      return
    }

    // Only animate if state actually changed
    if (previousStateRef.current === animationState) {
      return
    }

    previousStateRef.current = animationState
    const targetConfig = ANIMATION_PRESETS[animationState]
    
    // Animate the transition over time
    const steps = 60 // Number of steps for smooth transition
    let currentStep = 0
    
    const startConfig = { ...currentConfig }
    const interval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      
      // Ease-in-out function
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      
      setCurrentConfig({
        focus: startConfig.focus + (targetConfig.focus - startConfig.focus) * easeProgress,
        speed: startConfig.speed + (targetConfig.speed - startConfig.speed) * easeProgress,
        aperture: startConfig.aperture + (targetConfig.aperture - startConfig.aperture) * easeProgress,
        fov: startConfig.fov + (targetConfig.fov - startConfig.fov) * easeProgress,
        curl: startConfig.curl + (targetConfig.curl - startConfig.curl) * easeProgress,
      })
      
      if (currentStep >= steps) {
        clearInterval(interval)
        setCurrentConfig(targetConfig)
      }
    }, 16) // ~60fps
    
    return () => clearInterval(interval)
  }, [animationState, manualControls.useManual])

  // Add pulsating effect during streaming (like speaking)
  useEffect(() => {
    if (animationState === 'streaming' && !manualControls.useManual) {
      let time = 0
      let animationFrameId: number
      
      const animate = () => {
        time += 0.016 // Approximately 60fps worth of time increment
        // Create a very gentle breathing/pulsating wave effect
        const wave = Math.sin(time * 1.0) * 0.5 + 0.5 // Even slower, more gentle
        setPulsateOffset(wave)
        animationFrameId = requestAnimationFrame(animate)
      }
      
      animationFrameId = requestAnimationFrame(animate)
      
      return () => cancelAnimationFrame(animationFrameId)
    } else {
      setPulsateOffset(0)
    }
  }, [animationState, manualControls.useManual])

  // Apply pulsating effect to config during streaming (only fov and curl)
  const activeConfig = animationState === 'streaming' && !manualControls.useManual
    ? {
        ...currentConfig,
        curl: currentConfig.curl + (pulsateOffset * 0.02), // Very subtle curl pulsation
        fov: currentConfig.fov + (pulsateOffset * 0.2), // Very subtle size breathing
      }
    : currentConfig

  return (
    <div 
      className={className} 
      style={{ 
        width: '100%', 
        height: '100%', 
        ...style 
      }}
    >
      <Canvas
        linear
        dpr={2}
        camera={{ fov: 25, position: [0, 0, 9] }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene config={activeConfig} />
      </Canvas>
    </div>
  )
}

