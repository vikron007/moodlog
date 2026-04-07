import { useState, useEffect } from "react"
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth"
import { auth, provider } from "./firebase"
import MoodCalendar from "./MoodCalendar"

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return unsubscribe
  }, [])

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Login failed:", error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-12 w-80 text-center">
          <div className="text-5xl mb-4">🌤️</div>
          <h1 className="text-2xl font-medium text-gray-900 mb-2">MoodLog</h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Track your mood. Spot your patterns.<br />Write what's on your mind.
          </p>
          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            Continue with Google
          </button>
        </div>
      </div>
    )
  }

  return <MoodCalendar user={user} />
}

export default App