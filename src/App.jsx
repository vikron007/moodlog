import { useState, useEffect } from "react"
import { signInWithPopup, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, sendPasswordResetEmail } from "firebase/auth"
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
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState("")

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

  const handleResetPassword = async () => {
    setResetError("")
    if (!resetEmail) {
      setResetError("Please enter your email address.")
      return
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail)
      setResetSent(true)
    } catch (err) {
      setResetError(getErrorMessage(err.code))
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setUser(null)
    } catch (e) {
      console.error("Sign out error:", e)
    }
  }

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-white sm:bg-gray-50 flex items-center justify-center">
        <div className="bg-white sm:rounded-2xl sm:border sm:border-gray-200 p-12 w-full sm:w-80 text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Check your email</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            We sent a verification link to <strong>{email}</strong>. Click it to activate your account, then come back and sign in.
          </p>
          <p className="text-xs text-gray-400 mb-6">Can't find it? Check your spam folder.</p>
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

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-white sm:bg-gray-50 flex items-center justify-center">
        <div className="bg-white sm:rounded-2xl sm:border sm:border-gray-200 p-12 w-full sm:w-80 text-center">
          {resetSent ? (
            <>
              <div className="text-5xl mb-4">📩</div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">Email sent!</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-2">
                A password reset link has been sent to <strong>{resetEmail}</strong>.
              </p>
              <p className="text-xs text-gray-400 mb-6">Can't find it? Check your spam folder.</p>
              <button
                onClick={() => {
                  setShowForgotPassword(false)
                  setResetSent(false)
                  setResetEmail("")
                  setIsRegistering(false)
                }}
                className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                Back to sign in
              </button>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">🔑</div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">Reset password</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Enter your email and we'll send you a reset link.
              </p>
              <input
                type="email"
                placeholder="Your email address"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-300 text-left"
              />
              {resetError && (
                <p className="text-xs text-red-400 mb-3 leading-relaxed">{resetError}</p>
              )}
              <button
                onClick={handleResetPassword}
                className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 mb-3"
              >
                Send reset link
              </button>
              <button
                onClick={() => { setShowForgotPassword(false); setResetError("") }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white sm:bg-gray-50 flex items-center justify-center">
        <div className="bg-white sm:rounded-2xl sm:border sm:border-gray-200 p-12 w-full sm:w-80 text-center">
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
              style={{ WebkitTapHighlightColor: "transparent" }}
              className="w-full py-4 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 active:bg-gray-50"
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
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
              >
                {isRegistering ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
              {!isRegistering && (
                <button
                  onClick={() => { setShowForgotPassword(true); setResetError(""); setResetSent(false) }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-6 leading-relaxed">
            Your data is private and only visible to you.
          </p>
        </div>
      </div>
    )
  }

  return <MoodCalendar user={user} onSignOut={handleSignOut} />
}

export default App