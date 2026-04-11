import { useState, useEffect } from "react"
import { signInWithPopup, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { auth, provider } from "./firebase"
import MoodCalendar from "./MoodCalendar"
import { Capacitor } from "@capacitor/core"

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState("")
  const [showEmailForm, setShowEmailForm] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return unsubscribe
  }, [])

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Login failed:", error)
    }
  }

  const handleEmailAuth = async () => {
    setError("")
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
        setError(err.message || "Something went wrong. Please try again.")
        console.error("Auth error:", err)
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

          {!Capacitor.isNativePlatform() && (
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 mb-3"
            >
              Continue with Google
            </button>
          )}

          {!showEmailForm ? (
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Continue with Email
            </button>
          ) : (
            <div className="text-left">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
              {error && (
                <p className="text-xs text-red-500 mb-2">{error}</p>
              )}
              <button
                onClick={handleEmailAuth}
                className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 mb-2"
              >
                {isRegistering ? "Create account" : "Sign in"}
              </button>
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="w-full text-xs text-gray-400 hover:text-gray-600"
              >
                {isRegistering ? "Already have an account? Sign in" : "No account? Create one"}
              </button>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-6 leading-relaxed">
            Your data is private and only visible to you.
          </p>
        </div>
      </div>
    )
  }

  return <MoodCalendar user={user} />
}

export default App