import { useState, useEffect } from "react"
import { db } from "./firebase"
import { doc, setDoc, collection, getDocs } from "firebase/firestore"

const MOODS = [
  { value: 1, emoji: "😞", label: "Rough",   bg: "bg-red-50",    border: "border-red-200",   dot: "bg-red-400",    text: "text-red-800"   },
  { value: 2, emoji: "😕", label: "Low",     bg: "bg-amber-50",  border: "border-amber-200", dot: "bg-amber-400",  text: "text-amber-800" },
  { value: 3, emoji: "😐", label: "Okay",    bg: "bg-gray-100",  border: "border-gray-200",  dot: "bg-gray-400",   text: "text-gray-600"  },
  { value: 4, emoji: "🙂", label: "Good",    bg: "bg-green-50",  border: "border-green-200", dot: "bg-green-500",  text: "text-green-800" },
  { value: 5, emoji: "😄", label: "Great",   bg: "bg-green-100", border: "border-green-400", dot: "bg-green-600",  text: "text-green-900" },
]

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

export default function MoodCalendar({ user }) {
  const today = new Date()
  const [year, setYear]       = useState(today.getFullYear())
  const [month, setMonth]     = useState(today.getMonth())
  const [entries, setEntries] = useState({})
  const [selected, setSelected] = useState(null)
  const [mood, setMood]       = useState(null)
  const [note, setNote]       = useState("")
  const [saving, setSaving]   = useState(false)
  const [quote, setQuote] = useState(null)
  const [quoteAuthor, setQuoteAuthor] = useState(null)

  useEffect(() => {
    loadEntries()
  }, [year, month])

 useEffect(() => {
    fetch("https://zenquotes.io/api/random")
      .then(r => r.json())
      .then(data => {
        setQuote(data[0].q)
        setQuoteAuthor(data[0].a)
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
      mood,
      note,
      date: key,
      updatedAt: new Date().toISOString()
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

  function prevMonthHandler() { prevMonth() }

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
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear()

  const getEntry = (day) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return entries[key]
  }

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

  const selectedDateLabel = selected
    ? new Date(year, month, selected).toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })
    : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-medium">
              {user.displayName?.[0]}
            </div>
            <span className="text-sm font-medium text-gray-800">MoodLog</span>
          </div>
          
        </div>
        {quote && (
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Quote of the day</p>
                    <p className="text-sm text-gray-700 italic leading-relaxed mb-1">"{quote}"</p>
                    <p className="text-xs text-gray-400">— {quoteAuthor}</p>
                  </div>
                )}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="text-gray-400 hover:text-gray-600 text-xl px-1">‹</button>
            <span className="text-sm font-medium text-gray-800">{monthName} {year}</span>
            <button onClick={nextMonth} className="text-gray-400 hover:text-gray-600 text-xl px-1">›</button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1
              const entry = getEntry(day)
              const moodData = entry ? MOODS.find(m => m.value === entry.mood) : null
              const isSelected = selected === day
              const isTodayDay = isToday(day)

              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  disabled={new Date(year, month, day) > new Date(today.getFullYear(), today.getMonth(), today.getDate())}
                  className={`
                    aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all
                    ${moodData ? `${moodData.bg} ${moodData.text}` : "bg-gray-50 text-gray-500 hover:bg-gray-100"}
                    ${isSelected ? "ring-2 ring-blue-400 ring-offset-1" : ""}
                    ${isTodayDay && !isSelected ? "ring-1 ring-blue-300" : ""}
                    disabled:opacity-30 disabled:cursor-not-allowed
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

        {selected && (
          <div className="border-t border-gray-100 px-5 py-4">
            <p className="text-sm font-medium text-gray-800 mb-3">{selectedDateLabel}</p>
            <p className="text-xs text-gray-500 mb-2">How are you feeling?</p>
            <div className="flex gap-1.5 mb-3">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`
                    flex-1 py-2 rounded-lg border text-center transition-all
                    ${mood === m.value ? `${m.bg} ${m.border} border-2` : "bg-gray-50 border-gray-100 hover:bg-gray-100"}
                  `}
                >
                  <div className="text-base">{m.emoji}</div>
                  <div className={`text-xs mt-0.5 ${mood === m.value ? m.text : "text-gray-400"}`}>{m.value}</div>
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What's on your mind? (optional)"
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
            <button
              onClick={saveEntry}
              disabled={!mood || saving}
              className="w-full mt-2 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save entry"}
            </button>
          </div>
        )}

       <div className="px-5 pb-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Avg mood</p>
              <p className="text-xl font-medium text-gray-800">{avgMood ?? "—"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Days logged</p>
              <p className="text-xl font-medium text-gray-800">{monthEntries.length}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Streak</p>
              <p className="text-xl font-medium text-gray-800">{streak} {streak === 1 ? "day" : "days"}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Today</p>
          {todayEntry ? (
            <div className={`rounded-xl p-3 flex items-start gap-3 ${MOODS.find(m => m.value === todayEntry.mood)?.bg}`}>
              <span className="text-2xl">{MOODS.find(m => m.value === todayEntry.mood)?.emoji}</span>
              <div>
                <p className={`text-sm font-medium ${MOODS.find(m => m.value === todayEntry.mood)?.text}`}>
                  {MOODS.find(m => m.value === todayEntry.mood)?.label}
                </p>
                {todayEntry.note && (
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{todayEntry.note}</p>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => selectDay(today.getDate())}
              className="w-full py-3 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400 hover:bg-gray-50 transition-colors"
            >
              How are you feeling today? Tap to log →
            </button>
          )}
        </div>

      </div>
    </div>
  )
}