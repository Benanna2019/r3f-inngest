import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { askAIQuestion } from '../inngest/subscription-tokens'
import { AIOrb } from '../components/AIOrb'

// Hardcoded session ID for now - will be replaced with user auth later
const SESSION_ID = 'session-demo-001'

export const Route = createFileRoute('/test-sentience')({ component: TestSentience })

export default function TestSentience() {
  const [question, setQuestion] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAskQuestion = async () => {
    if (!question.trim()) return
    
    setIsProcessing(true)

    try {
      // Call server function to send AI question to Inngest
      await askAIQuestion({ 
        data: {
          sessionId: SESSION_ID,
          question: question.trim()
        }
      })
      
      // Clear question after triggering
      setQuestion('')
    } catch (error) {
      console.error('Failed to ask question:', error)
      setIsProcessing(false)
    } finally {
      // Don't reset isProcessing here - let the orb completion do it
      setTimeout(() => setIsProcessing(false), 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAskQuestion()
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* AI Orb - Always rendered, full screen background */}
      <AIOrb 
        sessionId={SESSION_ID} 
        onComplete={() => {
          console.log('Response complete!')
        }}
      />

      {/* Question Input - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pointer-events-auto">
        <div className="max-w-3xl mx-auto">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-4">
            <div className="flex gap-3 items-end">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask a question or start a conversation..."
                disabled={isProcessing}
                rows={1}
                className="flex-1 bg-transparent text-white placeholder-white/50 border-none outline-none resize-none text-lg px-2 py-2 disabled:opacity-50"
                style={{ 
                  minHeight: '2.5rem',
                  maxHeight: '10rem',
                  height: 'auto'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = `${target.scrollHeight}px`
                }}
              />
              <button
                onClick={handleAskQuestion}
                disabled={!question.trim() || isProcessing}
                className="px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:scale-100"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-pulse">●</span>
                    Processing
                  </span>
                ) : (
                  'Send'
                )}
              </button>
            </div>
            
            {/* Helpful hints */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-white/40 text-xs text-center">
                Press Enter to send • Shift + Enter for new line • Powered by GPT-4o-mini ✨
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}