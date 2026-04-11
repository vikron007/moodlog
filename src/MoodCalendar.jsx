import { useState, useEffect } from "react"
import { db, auth } from "./firebase"
import { doc, setDoc, collection, getDocs } from "firebase/firestore"
import { signOut } from "firebase/auth"

const MOODS = [
  { value: 1, emoji: "😞", label: "Rough",  bg: "bg-red-50",    border: "border-red-300",   dot: "bg-red-400",    text: "text-red-700"   },
  { value: 2, emoji: "😕", label: "Low",    bg: "bg-amber-50",  border: "border-amber-300", dot: "bg-amber-400",  text: "text-amber-700" },
  { value: 3, emoji: "😐", label: "Okay",   bg: "bg-gray-100",  border: "border-gray-300",  dot: "bg-gray-400",   text: "text-gray-600"  },
  { value: 4, emoji: "🙂", label: "Good",   bg: "bg-green-50",  border: "border-green-300", dot: "bg-green-500",  text: "text-green-700" },
  { value: 5, emoji: "😄", label: "Great",  bg: "bg-emerald-50",border: "border-emerald-400",dot: "bg-emerald-500",text: "text-emerald-700"},
]

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

export default function MoodCalendar({ user }) {
  const today = new Date()
  const [year, setYear]         = useState(today.getFullYear())
  const [month, setMonth]       = useState(today.getMonth())
  const [entries, setEntries]   = useState({})
  const [selected, setSelected] = useState(null)
  const [mood, setMood]         = useState(null)
  const [note, setNote]         = useState("")
  const [saving, setSaving]     = useState(false)
  const [quote, setQuote]       = useState(null)
  const [quoteAuthor, setQuoteAuthor] = useState(null)

  useEffect(() => { loadEntries() }, [year, month])

  useEffect(() => {
    fetch("https://api.adviceslip.com/advice")
      .then(r => r.json())
      .then(data => {
        setQuote(data.slip.advice)
        setQuoteAuthor("Daily Wisdom")
      })
      .catch(() => {
        setQuote("Every day is a new beginning.")
        setQuoteAuthor("Unknown")
      })
  }, [])

  async function loadEntries() {
    const ref = collection(db, "users", user.uid, "entries")
    const snap = await getDocs(ref)
    const data = {}
    snap.forEach(d => { data[d.id] = d.data() })
    setEntries(data)
  }

  async function saveEntry() {
    if (!mood || !selected) return
    setSaving(true)
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(selected).padStart(2, "0")}`
    await setDoc(doc(db, "users", user.uid, "entries", key), {
      mood, note, date: key, updatedAt: new Date().toISOString()
    })
    setEntries(prev => ({ ...prev, [key]: { mood, note, date: key } }))
    setSaving(false)
    setSelected(null)
    setMood(null)
    setNote("")
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelected(null)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  function selectDay(day) {
    const clicked = new Date(year, month, day)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    if (clicked > todayStart) return
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const existing = entries[key]
    setSelected(day)
    setMood(existing?.mood || null)
    setNote(existing?.note || "")
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = new Date(year, month).toLocaleString("default", { month: "long" })

  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const getEntry = (day) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return entries[key]
  }

  const selectedDateLabel = selected
    ? new Date(year, month, selected).toLocaleDateString("default", { weekday: "long", day: "numeric", month: "long" })
    : null

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  const todayEntry = entries[todayKey]

  const monthEntries = Object.values(entries).filter(e => {
    const [y, m] = e.date.split("-")
    return parseInt(y) === year && parseInt(m) === month + 1
  })

  const avgMood = monthEntries.length
    ? (monthEntries.reduce((sum, e) => sum + e.mood, 0) / monthEntries.length).toFixed(1)
    : null

  const streak = (() => {
    let count = 0
    const d = new Date(today)
    while (true) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      if (!entries[key]) break
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  })()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-0 px-0 sm:py-10 sm:px-4">
      <div className="w-full sm:max-w-sm bg-white sm:rounded-2xl border-0 sm:border sm:border-gray-100 overflow-hidden sm:shadow-sm">

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-base font-medium text-gray-900">MoodLog</span>
          <button
            onPointerUp={() => signOut(auth)}
            style={{ WebkitTapHighlightColor: "transparent" }}
            className="text-xs text-gray-400 hover:text-gray-600 active:text-gray-600 py-2 px-3 -mr-3"
          >
            Sign out
          </button>
        </div>

        {quote && (
          <div className="px-8 py-5 border-b border-gray-50 flex flex-col items-center text-center">
            <p className="text-xs font-medium text-gray-300 uppercase tracking-widest mb-3">Quote of the day</p>
            <p className="text-sm italic text-gray-400 leading-relaxed max-w-xs">"{quote}"</p>
            <p className="text-xs text-gray-300 mt-2">— {quoteAuthor}</p>
          </div>
        )}

        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <button
              onPointerUp={prevMonth}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className="text-gray-300 hover:text-gray-500 text-xl px-3 py-2 -ml-3"
            >‹</button>
            <span className="text-sm font-medium text-gray-800">{monthName} {year}</span>
            <button
              onPointerUp={nextMonth}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className="text-gray-300 hover:text-gray-500 text-xl px-3 py-2 -mr-3"
            >›</button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs text-gray-300 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1
              const entry = getEntry(day)
              const moodData = entry ? MOODS.find(m => m.value === entry.mood) : null
              const isSelected = selected === day
              const isTodayDay = isToday(day)
              const isFuture = new Date(year, month, day) > new Date(today.getFullYear(), today.getMonth(), today.getDate())

              return (
                <button
                  key={day}
                  onPointerUp={() => !isFuture && selectDay(day)}
                  disabled={isFuture}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all
                    ${moodData ? `${moodData.bg} ${moodData.text}` : "bg-gray-50 text-gray-400"}
                    ${isSelected ? "ring-2 ring-blue-400 ring-offset-1" : ""}
                    ${isTodayDay && !isSelected ? "ring-2 ring-blue-200" : ""}
                    ${isFuture ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  {day}
                  {moodData && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${moodData.dot}`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-6 pb-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-center">
              <p className="text-xs text-blue-400 mb-1">Avg mood</p>
              <p className="text-xl font-medium text-blue-700">{avgMood ?? "—"}</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3 text-center">
              <p className="text-xs text-purple-400 mb-1">Days logged</p>
              <p className="text-xl font-medium text-purple-700">{monthEntries.length}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
              <p className="text-xs text-emerald-400 mb-1">Streak</p>
              <p className="text-xl font-medium text-emerald-700">{streak}<span className="text-xs ml-1">{streak === 1 ? "d" : "d"}</span></p>
            </div>
          </div>
        </div>

        {selected && (
          <div className="border-t border-gray-100 px-6 py-5">
            <p className="text-sm font-medium text-gray-800 mb-3">{selectedDateLabel}</p>
            <div className="flex gap-2 mb-3">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  onPointerUp={() => setMood(m.value)}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className={`
                    flex-1 py-2 rounded-xl border-2 text-center transition-all
                    ${mood === m.value ? `${m.bg} ${m.border}` : "bg-gray-50 border-gray-100"}
                  `}
                >
                  <div className="text-lg">{m.emoji}</div>
                  <div className={`text-xs mt-0.5 ${mood === m.value ? m.text : "text-gray-300"}`}>{m.value}</div>
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What's on your mind? (optional)"
              rows={2}
              className="w-full text-sm border border-gray-100 rounded-xl px-4 py-3 resize-none text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-200 bg-gray-50"
            />
            <button
              onPointerUp={saveEntry}
              disabled={!mood || saving}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className="w-full mt-3 py-3.5 rounded-xl bg-emerald-500 text-white text-sm font-medium active:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save entry"}
            </button>
          </div>
        )}

        {todayEntry && (
          <div className="border-t border-gray-100 px-6 py-5">
            <p className="text-xs font-medium text-gray-300 uppercase tracking-widest mb-3">Today</p>
            <div className={`rounded-2xl p-4 flex items-start gap-4 ${MOODS.find(m => m.value === todayEntry.mood)?.bg}`}>
              <span className="text-3xl">{MOODS.find(m => m.value === todayEntry.mood)?.emoji}</span>
              <div>
                <p className={`text-sm font-medium ${MOODS.find(m => m.value === todayEntry.mood)?.text}`}>
                  {MOODS.find(m => m.value === todayEntry.mood)?.label}
                </p>
                {todayEntry.note && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{todayEntry.note}</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}