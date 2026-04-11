import { useState, useEffect } from "react"
import { signInWithPopup, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { auth, provider } from "./firebase"
import MoodCalendar from "./MoodCalendar"
import { Capacitor } from "@capacitor/core"

const getErrorMessage = (code) => {
  switch (code) {
    case "auth/email-already-in-use": return "An account with this email already exists. Try signing in instead."
    case "auth/invalid-email": return "Please enter a valid email address."
    case "auth/weak-password": return "Password must be at least 6 characters."
    case "auth/wrong-password": return "Incorrect password. Please try again."
    case "auth/user-not-found": return "No account found with this email. Create one below."
    case "auth/too-many-requests": return "Too many attempts. Please try again later."
    case "auth/invalid-credential": return "Incorrect email or password. Please try again."
    default: return "Something went wrong. Please try again."
  }
}

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isRegistering, setIsRegistering] = useState(true)
  const [error, setError] = useState("")
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser?.emailVerified || currentUser?.providerData?.[0]?.providerId === "google.com") {
        setUser(currentUser)
      }
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
    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    try {
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        await sendEmailVerification(result.user)
        setVerificationSent(true)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError(getErrorMessage(err.code))
    }
  }

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-12 w-80 text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Check your email</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            We sent a verification link to <strong>{email}</strong>. Click it to activate your account, then come back and sign in.
          </p>
          <button
            onClick={() => { setVerificationSent(false); setIsRegistering(false) }}
            className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            Go to sign in
          </button>
        </div>
      </div>
    )
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

          {!Capacitor.isNativePlatform() && !showEmailForm && (
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
              <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                {isRegistering ? "Create your account" : "Welcome back"}
              </p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
              <input
                type="password"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
              {error && (
                <p className="text-xs text-red-400 mb-2 leading-relaxed">{error}</p>
              )}
              <button
                onClick={handleEmailAuth}
                className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 mb-3"
              >
                {isRegistering ? "Create account" : "Sign in"}
              </button>
              <button
                onClick={() => { setIsRegistering(!isRegistering); setError("") }}
                className="w-full text-xs text-gray-300 hover:text-gray-400 transition-colors"
              >
                {isRegistering ? "Already have an account? Sign in" : "New here? Create an account"}
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