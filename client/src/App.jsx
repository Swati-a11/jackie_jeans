import { useState, useEffect, useRef, useCallback } from "react"

// ─── Denim Catalog ─────────────────────────────────────────────────────────────
const denimCatalog = [
  {
    id: "raw-slim",
    name: "Jackie Raw Indigo Slim",
    model: "Model D-01 Slim Fit",
    fits: ["Snug", "Regular"],
    washes: ["Raw Indigo"],
    stretch: ["Rigid"],
    budget: ["Premium"],
    description: "Tailored slim through the thigh with a tapered hem. Crafted from heavy Japanese raw indigo selvedge denim.",
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop",
    price: "$148"
  },
  {
    id: "classic-straight",
    name: "Jackie Classic Straight",
    model: "Model D-02 Straight Fit",
    fits: ["Regular"],
    washes: ["Raw Indigo", "Vintage Wash"],
    stretch: ["Rigid", "Stretch"],
    budget: ["Under $100", "Premium"],
    description: "A timeless mid-rise cut with a straight leg from hip to hem. Crafted from organic ring-spun cotton denim.",
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop",
    price: "$138"
  },
  {
    id: "relaxed-comfort",
    name: "Jackie Relaxed Comfort",
    model: "Model D-05 Relaxed Fit",
    fits: ["Relaxed"],
    washes: ["Vintage Wash", "Charcoal Black"],
    stretch: ["Stretch"],
    budget: ["Under $100", "Premium"],
    description: "Extra room in the seat and thigh for all-day comfort. Made with our premium Active Stretch custom weave.",
    imageUrl: "https://images.unsplash.com/photo-1582552945292-e01a5297f1f8?q=80&w=600&auto=format&fit=crop",
    price: "$148"
  },
  {
    id: "athletic-taper",
    name: "Jackie Athletic Tapered",
    model: "Model D-03 Athletic Fit",
    fits: ["Regular", "Relaxed"],
    washes: ["Charcoal Black", "Vintage Wash"],
    stretch: ["Stretch"],
    budget: ["Premium"],
    description: "Designed for muscular builds: roomy through the hips and thighs, with a smart taper to the ankle.",
    imageUrl: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=600&auto=format&fit=crop",
    price: "$158"
  }
]

// Score a catalog item against voice answers (higher = better match)
const matchVoiceResult = (answers) => {
  let best = null
  let bestScore = -1
  denimCatalog.forEach(item => {
    let score = 0
    if (answers.fit  && item.fits.includes(answers.fit))     score += 3
    if (answers.wash && item.washes.includes(answers.wash))  score += 2
    if (answers.stretch && item.stretch.includes(answers.stretch)) score += 2
    if (answers.budget && item.budget.includes(answers.budget))    score += 1
    if (score > bestScore) { bestScore = score; best = item }
  })
  const matchPct = Math.min(99, 78 + bestScore * 3)
  return { ...best, matchScore: matchPct }
}

// Calculation utility function for size inference
const calculateJeansProfile = (waist, hip, preference) => {
  const w = parseInt(waist) || 32
  const h = parseInt(hip) || 38
  const pref = (preference || "Regular").toLowerCase()

  let recommendedSize = w
  if (pref.includes("snug") || pref === "tight") {
    recommendedSize = w - 1
  } else if (pref.includes("relax") || pref === "loose") {
    recommendedSize = w + 1
  }

  const curvyFit = (h - w) > 8

  let recommendedCut = "Regular Straight Cut"
  if (pref.includes("snug") || pref === "tight") {
    recommendedCut = "Snug Slim Cut"
  } else if (pref.includes("relax") || pref === "loose") {
    recommendedCut = "Relaxed Comfort Cut"
  }

  return {
    size: recommendedSize,
    cut: recommendedCut,
    curvyFit: curvyFit,
    waist: w,
    hip: h,
    preference: preference || "Regular"
  }
}

// ─── Dynamic Image Visuals Mapping ───────────────────────────────────────────
const visualImages = {
  studio: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=600",
  denimText: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600",
  silhouette: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=600",
  stacks: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600"
}

const getStepVisual = (state, quizStep, voiceIdx) => {
  if (state === 0) return "studio"
  if (state === 1) {
    if (quizStep === 1) return "silhouette"
    if (quizStep === 2) return "denimText"
    if (quizStep === 3) return "stacks"
    return "stacks"
  }
  if (state === 2) {
    if (voiceIdx === 0) return "silhouette"
    if (voiceIdx === 1) return "studio"
    if (voiceIdx >= 2 && voiceIdx <= 4) return "denimText"
    if (voiceIdx === 5) return "stacks"
    if (voiceIdx === 6) return "silhouette"
    if (voiceIdx === 7) return "stacks"
    if (voiceIdx === 8 || voiceIdx === 9) return "stacks"
    if (voiceIdx === 10) return "studio"
    return "stacks"
  }
  return "studio"
}
import { Sliders, Sparkles, Mic, ArrowLeft, Check, RefreshCw, Volume2, ShieldCheck, X, Sun, Moon, VolumeX, AlertCircle, Play } from "lucide-react"
import { PromptingIsAllYouNeed } from "./components/ui/animated-hero-section"

// ─── Fit Questions ─────────────────────────────────────────────────────────────
const fitQuestions = [
  {
    text: "What fit do you prefer? Snug, regular, or relaxed?",
    key: "fit",
    errorMsg: "Sorry, I didn't catch that. Please say snug, regular, or relaxed.",
    confirmMsg: "Got it — {val} fit.",
    parse: (t) => {
      if (/snug|tight|skinny/.test(t)) return "Snug"
      if (/regular|straight|normal/.test(t)) return "Regular"
      if (/relax|loose|baggy/.test(t)) return "Relaxed"
      return null
    }
  },
  {
    text: "What is your height? For example say: five foot eight. Or say pass to skip.",
    key: "height",
    errorMsg: "I didn't catch that. Please say your height, like five foot eight, or say pass.",
    confirmMsg: "Got it — {val}.",
    parse: (t) => {
      if (/skip|pass|no/.test(t)) return "Skipped"
      const norm = t.replace(/-/g, " ")
        .replace(/\bfor\b/g, "four").replace(/\bforth\b/g, "four")
        .replace(/\bto\b/g, "two").replace(/\btoo\b/g, "two")
      const feetMap = { four: 4, five: 5, six: 6, seven: 7, 4: 4, 5: 5, 6: 6, 7: 7 }
      const inchMap = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11 }
      let feet = 0, inches = 0
      for (const [word, val] of Object.entries(feetMap)) {
        if (norm.includes(word)) { feet = val; break }
      }
      if (feet > 0) {
        const afterFeet = norm.slice(norm.indexOf(String(feet > 6 ? "seven" : feet > 5 ? "six" : feet > 4 ? "five" : "four")) + 4)
        for (const [word, val] of Object.entries(inchMap)) {
          if (afterFeet.includes(word)) { inches = val; break }
        }
        const m = afterFeet.match(/\b(\d+)\b/)
        if (m && inches === 0) inches = parseInt(m[1])
      }
      if (feet === 0) {
        const m = norm.match(/\b([4-7])\b/)
        if (m) feet = parseInt(m[1])
      }
      return feet > 0 ? `${feet}'${inches}"` : null
    }
  },
  {
    text: "What is your waist size in inches? For example: thirty two.",
    key: "waist",
    errorMsg: "I didn't catch that. Please say your waist size in inches, like thirty two.",
    confirmMsg: "Got it — {val} inch waist.",
    parse: (t) => {
      const words = { twentyeight:28,twentynine:29,thirty:30,thirtyone:31,thirtytwo:32,thirtythree:33,thirtyfour:34,thirtyfive:35,thirtysix:36 }
      const norm = t.toLowerCase().replace(/\s+/g,"")
      for (const [w, v] of Object.entries(words)) if (norm.includes(w)) return v
      const m = t.match(/\b(2[89]|3[0-9]|4[0-4])\b/)
      return m ? parseInt(m[1]) : null
    }
  },
  {
    text: "What is your hip size in inches? For example: thirty eight.",
    key: "hip",
    errorMsg: "I didn't catch that. Please say your hip size in inches, like thirty eight.",
    confirmMsg: "Got it — {val} inch hip.",
    parse: (t) => {
      const words = { thirty:30,thirtytwo:32,thirtyfour:34,thirtysix:36,thirtyeight:38,forty:40,fortytwo:42,fortyfour:44,fortysix:46,fortyeight:48,fifty:50,fiftytwo:52 }
      const norm = t.toLowerCase().replace(/\s+/g,"")
      for (const [w, v] of Object.entries(words)) if (norm.includes(w)) return v
      const m = t.match(/\b(3[0-9]|4[0-9]|5[0-2])\b/)
      return m ? parseInt(m[1]) : null
    }
  },
  {
    text: "What is your inseam length in inches? For example: thirty or thirty two.",
    key: "length",
    errorMsg: "I didn't catch that. Please say your inseam length, like thirty or thirty two.",
    confirmMsg: "Got it — {val} inch inseam.",
    parse: (t) => {
      const words = { twentyeight:28,twentynine:29,thirty:30,thirtyone:31,thirtytwo:32,thirtythree:33,thirtyfour:34,thirtyfive:35,thirtysix:36 }
      const norm = t.toLowerCase().replace(/\s+/g,"")
      for (const [w, v] of Object.entries(words)) if (norm.includes(w)) return v
      const m = t.match(/\b(2[89]|3[0-9])\b/)
      return m ? parseInt(m[1]) : null
    }
  },
  {
    text: "Which wash do you prefer? Raw indigo, vintage wash, or charcoal black?",
    key: "wash",
    errorMsg: "I didn't catch that. Please say raw indigo, vintage wash, or charcoal black.",
    confirmMsg: "Got it — {val}.",
    parse: (t) => {
      if (/raw|indig/.test(t)) return "Raw Indigo"
      if (/vintage|light|blue/.test(t)) return "Vintage Wash"
      if (/charcoal|black/.test(t)) return "Charcoal Black"
      return null
    }
  },
  {
    text: "Do you prefer stretch denim or rigid cotton?",
    key: "stretch",
    errorMsg: "I didn't catch that. Please say stretch or rigid.",
    confirmMsg: "Got it — {val}.",
    parse: (t) => {
      if (/stretch|flex|comfort/.test(t)) return "Stretch"
      if (/rigid|cotton|stiff/.test(t)) return "Rigid"
      return null
    }
  },
  {
    text: "What is your typical budget? Say under one hundred, or premium.",
    key: "budget",
    errorMsg: "I didn't catch that. Please say under one hundred, or premium.",
    confirmMsg: "Got it — {val} budget.",
    parse: (t) => {
      if (/under|hundred|cheap|low/.test(t)) return "Under $100"
      if (/premium|high|luxury/.test(t)) return "Premium"
      return null
    }
  },
  {
    text: "What denim brands do you normally wear? For example: Levis and Zara.",
    key: "brands",
    errorMsg: "I didn't catch that. Please tell me one or two brands you wear.",
    confirmMsg: "Got it.",
    parse: (t) => {
      const parts = t.split(/\band\b|,/).map(s => s.trim()).filter(Boolean)
      return parts.length > 0 ? parts.map(s => s.charAt(0).toUpperCase() + s.slice(1)) : null
    }
  },
  {
    text: "What size do you wear in {brand}?",
    key: "brandSizes",
    errorMsg: "I didn't catch that. Please say your size.",
    confirmMsg: "Got it — size {val} in {brand}.",
    parse: (t) => {
      if (/small/.test(t)) return "Small"
      if (/medium/.test(t)) return "Medium"
      if (/large/.test(t)) return "Large"
      const m = t.match(/\b\d+\b/)
      return m ? m[0] : t.trim() || null
    }
  },
  {
    text: "Last question. How often do you buy jeans? Monthly, seasonally, or rarely?",
    key: "frequency",
    errorMsg: "I didn't catch that. Please say monthly, seasonally, or rarely.",
    confirmMsg: "Perfect. {val}.",
    parse: (t) => {
      if (/month/.test(t)) return "Monthly"
      if (/season/.test(t)) return "Seasonally"
      if (/rare|hardly|never/.test(t)) return "Rarely"
      return null
    }
  }
]

// ─── Quick-tap chip options per question index ────────────────────────────────
const chipOptions = [
  ["Snug", "Regular", "Relaxed"],
  ["4'8\"", "5'0\"", "5'4\"", "5'8\"", "6'0\"", "Skip"],
  [28, 30, 32, 34, 36].map(n => `${n}`),
  [34, 36, 38, 40, 42, 44].map(n => `${n}`),
  [28, 30, 32, 34].map(n => `${n}`),
  ["Raw Indigo", "Vintage Wash", "Charcoal Black"],
  ["Stretch", "Rigid"],
  ["Under $100", "Premium"],
  ["Levis", "Zara", "H&M"],
  ["Small", "Medium", "Large", "32"],
  ["Monthly", "Seasonally", "Rarely"],
]

export default function App() {
  const [theme, setTheme] = useState("dark")
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [state, setState] = useState(0) // 0:Home 1:Manual 2:Voice

  // ── Calculation and transition states ────────────────────────────────────────
  const [showSummarySlide, setShowSummarySlide] = useState(false)
  const [sizeProfile, setSizeProfile] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editingValue, setEditingValue] = useState(null)

  // ── Manual quiz ──────────────────────────────────────────────────────────────
  const [quizStep, setQuizStep] = useState(1)
  const [quizData, setQuizData] = useState({ fit:"Regular", waist:32, hip:38, length:32, wash:"Dark Indigo", stretch:"Comfort Stretch" })
  const [quizResult, setQuizResult] = useState(null)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)

  // ── Voice quiz state ─────────────────────────────────────────────────────────
  const [voicePhase, setVoicePhase] = useState("idle") // idle|speaking|listening|confirming|done
  const [voiceIdx, setVoiceIdx]   = useState(0)
  const [aiCaption, setAiCaption] = useState("")
  const [userCaption, setUserCaption] = useState("")
  const [micBlocked, setMicBlocked] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [voiceAnswers, setVoiceAnswers] = useState({})
  const [brandsList, setBrandsList] = useState([])
  const [brandIdx, setBrandIdx] = useState(0)

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const abortRef   = useRef(false)   // set true to stop the whole chain
  const recRef     = useRef(null)
  const isMutedRef = useRef(false)

  // Keep muted ref in sync
  useEffect(() => { isMutedRef.current = isMuted }, [isMuted])

  // ── Theme sync ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark",  theme === "dark")
    root.classList.toggle("light", theme === "light")
  }, [theme])

  // ── Build SpeechRecognition once ─────────────────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.continuous    = false
    r.interimResults = false
    r.lang          = "en-US"
    recRef.current  = r
  }, [])

  // ── Cleanup on unmount / leave voice state ────────────────────────────────────
  useEffect(() => {
    if (state !== 2) stopAll()
  }, [state])

  // ── Inline Manual Editor Helpers ───────────────────────────────────────────────
  const saveEditedField = () => {
    if (!editingField) return
    if (state === 1) {
      setQuizData(prev => ({ ...prev, [editingField]: editingValue }))
    } else if (state === 2) {
      setVoiceAnswers(prev => ({ ...prev, [editingField]: editingValue }))
    }
    setEditingField(null)
    setEditingValue(null)
  }

  const renderEditorInput = () => {
    if (!editingField) return null
    const val = editingValue

    if (editingField === "waist") {
      return (
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-semibold text-zinc-300">
            <span>Select Waist Size:</span>
            <span className="font-mono font-bold text-white text-sm">{val}"</span>
          </div>
          <input type="range" min="28" max="44" value={val || 32}
            onChange={e => setEditingValue(parseInt(e.target.value))}
            className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-zinc-850 accent-white"
          />
        </div>
      )
    }

    if (editingField === "hip") {
      return (
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-semibold text-zinc-300">
            <span>Select Hip Size:</span>
            <span className="font-mono font-bold text-white text-sm">{val}"</span>
          </div>
          <input type="range" min="30" max="52" value={val || 38}
            onChange={e => setEditingValue(parseInt(e.target.value))}
            className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-zinc-850 accent-white"
          />
        </div>
      )
    }

    if (editingField === "length") {
      return (
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-semibold text-zinc-300">
            <span>Select Inseam Length:</span>
            <span className="font-mono font-bold text-white text-sm">{val}"</span>
          </div>
          <input type="range" min="28" max="36" value={val || 32}
            onChange={e => setEditingValue(parseInt(e.target.value))}
            className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-zinc-850 accent-white"
          />
        </div>
      )
    }

    if (editingField === "fit") {
      return (
        <div className="space-y-3">
          <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">Waist Preference</label>
          <div className="flex gap-2">
            {["Snug", "Regular", "Relaxed"].map(option => (
              <button key={option} onClick={() => setEditingValue(option)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  val === option ? "border-white bg-white/5 text-white" : "border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >{option}</button>
            ))}
          </div>
        </div>
      )
    }

    if (editingField === "wash") {
      return (
        <div className="space-y-3">
          <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">Preferred Wash</label>
          <div className="flex flex-col gap-2">
            {["Raw Indigo", "Vintage Wash", "Charcoal Black"].map(option => (
              <button key={option} onClick={() => setEditingValue(option)}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold border text-left px-4 transition-all cursor-pointer ${
                  val === option ? "border-white bg-white/5 text-white" : "border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >{option}</button>
            ))}
          </div>
        </div>
      )
    }

    if (editingField === "stretch") {
      return (
        <div className="space-y-3">
          <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">Denim Stretch</label>
          <div className="flex gap-2">
            {["Stretch", "Rigid"].map(option => (
              <button key={option} onClick={() => setEditingValue(option)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  val === option ? "border-white bg-white/5 text-white" : "border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >{option}</button>
            ))}
          </div>
        </div>
      )
    }

    if (editingField === "budget") {
      return (
        <div className="space-y-3">
          <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">Budget Range</label>
          <div className="flex gap-2">
            {["Under $100", "Premium"].map(option => (
              <button key={option} onClick={() => setEditingValue(option)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  val === option ? "border-white bg-white/5 text-white" : "border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >{option}</button>
            ))}
          </div>
        </div>
      )
    }

    if (editingField === "height") {
      return (
        <div className="space-y-3">
          <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">Height</label>
          <div className="flex flex-wrap gap-2 justify-center">
            {["4'8\"", "5'0\"", "5'4\"", "5'8\"", "6'0\"", "Skip"].map(option => (
              <button key={option} onClick={() => setEditingValue(option)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  val === option ? "border-white bg-white/5 text-white" : "border-zinc-855 bg-zinc-955/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >{option}</button>
            ))}
          </div>
        </div>
      )
    }

    if (editingField === "frequency") {
      return (
        <div className="space-y-3">
          <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">Purchase Frequency</label>
          <div className="flex gap-2">
            {["Monthly", "Seasonally", "Rarely"].map(option => (
              <button key={option} onClick={() => setEditingValue(option)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  val === option ? "border-white bg-white/5 text-white" : "border-zinc-850 bg-zinc-955/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >{option}</button>
            ))}
          </div>
        </div>
      )
    }

    return null
  }

  const renderLiveSummary = () => {
    const isManualInProgress = state === 1 && quizStep < 4
    const isVoiceInProgress = state === 2 && voicePhase !== "done" && voicePhase !== "idle"
    
    if (showSummarySlide) return null
    if (!isManualInProgress && !isVoiceInProgress) return null

    const answers = state === 1 ? quizData : voiceAnswers
    const chipsList = []
    
    const addChip = (key, label, icon = "⚡") => {
      const val = answers[key]
      if (val !== undefined && val !== null && val !== "") {
        chipsList.push({ key, label, val, icon })
      }
    }

    addChip("fit", "Fit Style")
    if (state === 2) addChip("height", "Height")
    addChip("waist", "Waist")
    addChip("hip", "Hip")
    addChip("length", "Inseam")
    addChip("wash", "Wash")
    addChip("stretch", "Stretch")
    if (state === 2) {
      addChip("budget", "Budget")
      addChip("frequency", "Frequency")
    }

    if (chipsList.length === 0) return null

    return (
      <div className={`mt-5 pt-3 border-t flex flex-col gap-1.5 ${
        theme === "light" ? "border-zinc-200" : "border-zinc-900"
      }`}>
        <span className={`text-[9px] uppercase tracking-widest font-bold ${
          theme === "light" ? "text-zinc-500" : "text-zinc-600"
        }`}>Live Summary (Tap to Edit)</span>
        <div className="flex flex-wrap gap-2 max-h-16 overflow-y-auto no-scrollbar py-0.5">
          {chipsList.map(chip => (
            <button
              key={chip.key}
              onClick={() => {
                setEditingField(chip.key)
                setEditingValue(chip.val)
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold transition-all hover:scale-105 cursor-pointer ${
                theme === "light"
                  ? "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300"
                  : "bg-zinc-950/80 border-zinc-850 text-zinc-300 hover:bg-zinc-900/60 hover:border-zinc-700"
              }`}
            >
              <span>{chip.icon}</span>
              <span>{chip.label}:</span>
              <span className={theme === "light" ? "text-zinc-950" : "text-white"}>
                {typeof chip.val === "object" ? JSON.stringify(chip.val) : chip.val}
                {["waist", "hip", "length"].includes(chip.key) ? '"' : ""}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const stopAll = () => {
    abortRef.current = true
    window.speechSynthesis?.cancel()
    try { recRef.current?.abort() } catch(_) {}
    setVoicePhase("idle")
  }

  // ── Wait for voices to be loaded (Chrome loads them async) ──────────────────
  const loadVoices = () => new Promise((resolve) => {
    const synth = window.speechSynthesis
    if (!synth) { resolve([]); return }
    const voices = synth.getVoices()
    if (voices.length > 0) { resolve(voices); return }
    // Voices not ready yet — wait for the event (fires once in Chrome)
    const onChanged = () => {
      synth.removeEventListener("voiceschanged", onChanged)
      resolve(synth.getVoices())
    }
    synth.addEventListener("voiceschanged", onChanged)
    // Safety: resolve after 2s even if event never fires
    setTimeout(() => { synth.removeEventListener("voiceschanged", onChanged); resolve(synth.getVoices()) }, 2000)
  })

  // ── Promise: speak text aloud, resolves when utterance ends ──────────────────
  const speak = useCallback((text) => {
    setAiCaption(text)
    setVoicePhase("speaking")
    return new Promise(async (resolve) => {
      if (isMutedRef.current) {
        setTimeout(resolve, 400)
        return
      }
      const synth = window.speechSynthesis
      if (!synth) { resolve(); return }

      // ── Step 1: Hard-reset Chrome synthesis state ──
      // Chrome can get stuck in a "paused" state after cancel(). resume() unsticks it.
      synth.cancel()
      await new Promise(r => setTimeout(r, 50))
      synth.resume()
      await new Promise(r => setTimeout(r, 80))

      if (abortRef.current) { resolve(); return }

      // ── Step 2: Wait for voice list ──
      const voices = await loadVoices()
      if (abortRef.current) { resolve(); return }

      // ── Step 3: Build utterance ──
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate   = 0.90
      utter.pitch  = 1.0
      utter.volume = 1.0

      const pick =
        voices.find(v => v.name === "Samantha") ||
        voices.find(v => v.name === "Google US English") ||
        voices.find(v => /karen|victoria|zira|hazel/i.test(v.name)) ||
        voices.find(v => v.lang === "en-US" && v.localService) ||
        voices.find(v => v.lang === "en-US") ||
        voices.find(v => v.lang?.startsWith("en")) ||
        voices[0]

      if (pick) {
        utter.voice = pick
        utter.lang  = pick.lang
        console.log(`[Voice] Using: "${pick.name}" (${pick.lang})`)
      }

      let done = false
      let heartbeat = null

      const finish = () => {
        if (done) return
        done = true
        clearInterval(heartbeat)
        clearTimeout(noStartWd)
        clearTimeout(hardWd)
        resolve()
      }

      // ── Heartbeat: Chrome pauses synthesis mid-sentence on some builds.
      // Calling resume() every 5s keeps it running.
      heartbeat = setInterval(() => {
        if (synth.paused) {
          console.log("[Voice] Heartbeat: resuming paused synth")
          synth.resume()
        }
      }, 5000)

      // ── No-start watchdog: if onstart hasn't fired in 1.5s, Chrome is frozen.
      // Cancel, wait, and retry once with a fresh utterance.
      let started = false
      const noStartWd = setTimeout(async () => {
        if (started || done) return
        console.warn("[Voice] onstart never fired — Chrome frozen. Retrying...")
        synth.cancel()
        clearInterval(heartbeat)
        await new Promise(r => setTimeout(r, 200))
        synth.resume()
        await new Promise(r => setTimeout(r, 100))
        if (abortRef.current || done) { resolve(); return }

        // Retry with a fresh utterance
        const u2 = new SpeechSynthesisUtterance(text)
        u2.rate = 0.90; u2.pitch = 1.0; u2.volume = 1.0
        if (pick) { u2.voice = pick; u2.lang = pick.lang }
        heartbeat = setInterval(() => { if (synth.paused) synth.resume() }, 5000)
        u2.onstart = () => { started = true }
        u2.onend   = finish
        u2.onerror = (e) => { if (e.error !== "interrupted" && e.error !== "canceled") console.warn("[Voice] Retry error:", e.error); finish() }
        synth.speak(u2)
      }, 1500)

      // ── Hard watchdog: absolute ceiling — speech should never take longer than this
      const hardWd = setTimeout(() => {
        console.warn("[Voice] Hard watchdog fired")
        synth.cancel()
        finish()
      }, Math.max(8000, text.length * 90))

      utter.onstart = () => { started = true; console.log("[Voice] onstart fired ✓") }
      utter.onend   = finish
      utter.onerror = (e) => {
        if (e.error !== "interrupted" && e.error !== "canceled") {
          console.warn("[Voice] SpeechSynthesis error:", e.error)
        }
        finish()
      }

      synth.speak(utter)
    })
  }, [])

  // ── Promise: listen once, resolves with transcript string ─────────────────────
  const listen = useCallback(() => {
    setVoicePhase("listening")
    setUserCaption("")
    return new Promise((resolve) => {
      const rec = recRef.current
      if (!rec) { resolve(""); return }

      // Abort any running session first, wait for audio pipeline to settle
      try { rec.abort() } catch(_) {}

      setTimeout(() => {
        if (abortRef.current) { resolve(""); return }

        let done = false
        const finish = (text) => {
          if (done) return
          done = true
          rec.onresult = null
          rec.onerror  = null
          rec.onend    = null
          resolve(text)
        }

        rec.onresult = (e) => {
          const t = e.results[0][0].transcript.toLowerCase().trim()
          setUserCaption(t)
          finish(t)
        }

        rec.onerror = (e) => {
          if (e.error === "not-allowed") {
            setMicBlocked(true)
            finish("")
          } else if (e.error === "aborted") {
            // swallow — triggered by our own abort() call
          } else {
            finish("")
          }
        }

        rec.onend = () => finish("") // no-speech timeout — treat as empty

        try {
          rec.start()
        } catch(e) {
          // already started — abort and retry once
          try { rec.abort() } catch(_) {}
          setTimeout(() => {
            try { rec.start() } catch(_) { finish("") }
          }, 300)
        }
      }, 500) // 500ms gap so synthesis microphone lock is fully released
    })
  }, [])

  // ── Main linear voice chain ───────────────────────────────────────────────────
  const runVoiceChain = useCallback(async (startIdx, brandsArg, bIdxArg) => {
    abortRef.current = false
    let answers = { ...voiceAnswers }
    let brands  = brandsArg  ?? []
    let bIdx    = bIdxArg    ?? 0
    let idx     = startIdx   ?? 0

    while (idx < fitQuestions.length) {
      if (abortRef.current) break

      const q = fitQuestions[idx]
      setVoiceIdx(idx)

      // Resolve question text (brand substitution for brandSizes)
      let qText = q.text
      if (q.key === "brandSizes") {
        if (brands.length === 0) { idx++; continue }
        qText = q.text.replace("{brand}", brands[bIdx])
      }

      // ① Speak question
      await speak(qText)
      if (abortRef.current) break

      // ② Listen for answer (up to 2 attempts on failure)
      let value = null
      let attempts = 0
      while (value === null && attempts < 2) {
        if (abortRef.current) break
        const transcript = await listen()
        if (abortRef.current) break

        value = q.parse(transcript.toLowerCase().trim())

        if (value === null && transcript.trim() !== "") {
          // Bad answer — speak error and retry
          attempts++
          if (attempts < 2) await speak(q.errorMsg)
        }
        if (value === null && transcript.trim() === "") {
          // Silence — re-ask same question
          attempts++
        }
      }

      if (abortRef.current) break
      if (value === null) {
        // After 2 failed attempts, skip this question
        idx++
        continue
      }

      // ③ Speak confirmation
      const bName = brands[bIdx] || ""
      const confirmText = q.confirmMsg
        .replace("{val}", value)
        .replace("{brand}", bName)
      setVoicePhase("confirming")
      await speak(confirmText)
      if (abortRef.current) break

      // ④ Save answer
      if (q.key === "brands") {
        brands = value
        setBrandsList(value)
        setBrandIdx(0)
        answers.brands = value
        setVoiceAnswers(prev => ({ ...prev, brands: value }))
        // Next: ask brandSizes for first brand
        idx++
        bIdx = 0
      } else if (q.key === "brandSizes") {
        answers.brandSizes = { ...(answers.brandSizes || {}), [brands[bIdx]]: value }
        setVoiceAnswers(prev => {
          const sizes = { ...(prev.brandSizes || {}), [brands[bIdx]]: value }
          return { ...prev, brandSizes: sizes }
        })
        bIdx++
        if (bIdx < brands.length) {
          // Stay on brandSizes question for next brand
          setBrandIdx(bIdx)
          continue
        } else {
          idx++
        }
      } else {
        answers[q.key] = value
        setVoiceAnswers(prev => ({ ...prev, [q.key]: value }))
        idx++
      }
    }

    if (!abortRef.current) {
      const profile = calculateJeansProfile(answers.waist || 32, answers.hip || 38, answers.fit || "Regular")
      setSizeProfile(profile)
      setShowSummarySlide(true)
      await speak(`All done! Profile matched. We recommend size ${profile.size} in a ${profile.cut}.`)
      await new Promise(r => setTimeout(r, 3000))
      setShowSummarySlide(false)
      setVoicePhase("done")
    }
  }, [speak, listen, voiceAnswers])

  // ── Manual quiz helpers ───────────────────────────────────────────────────────
  const submitManualQuiz = async () => {
    setSubmittingQuiz(true)
    const profile = calculateJeansProfile(quizData.waist, quizData.hip, quizData.fit)
    setSizeProfile(profile)
    setShowSummarySlide(true)

    // Wait 3 seconds for the beautiful "Profile Matched!" screen
    await new Promise(r => setTimeout(r, 3000))
    setShowSummarySlide(false)

    try {
      const res = await fetch("http://localhost:5001/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData)
      })
      const data = await res.json()
      if (data.success) { setQuizResult(data.match); setQuizStep(4) }
    } catch {
      setQuizResult({
        name: "Jackie Classic Straight",
        model: "Model D-02 Straight Fit",
        matchScore: 94,
        description: "A timeless mid-rise cut with a straight leg from hip to hem. Crafted from organic ring-spun cotton denim.",
        imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop",
        price: "$138"
      })
      setQuizStep(4)
    } finally { setSubmittingQuiz(false) }
  }

  const resetManual = () => {
    setQuizStep(1)
    setQuizResult(null)
    setQuizData({ fit:"Regular", waist:32, hip:38, length:32, wash:"Dark Indigo", stretch:"Comfort Stretch" })
  }

  // ── Helper to warm up synthesis on click (user-gesture required) ──────────────
  const warmUpSynth = () => {
    const s = window.speechSynthesis
    if (!s) return
    s.cancel()
    const w = new SpeechSynthesisUtterance("")
    w.volume = 0
    s.speak(w)
  }

  // ── Chip tap handler (bypass voice recognition) ───────────────────────────────
  const handleChipTap = (val) => {
    const chipVal = val === "Skip" ? "pass" : val.toString()
    setUserCaption(chipVal)
    // Inject answer by temporarily overriding the recognition result
    if (recRef.current) {
      try { recRef.current.abort() } catch(_) {}
    }
    // Fire a synthetic result via the current question's parse
    const q = fitQuestions[voiceIdx]
    const parsed = q.parse(chipVal.toLowerCase())
    if (parsed !== null) {
      // Simulate a result by dispatching to the chain via userCaption state
      // We achieve this by creating a fake transcript event
      setUserCaption(chipVal)
      // The cleanest approach: stop listening and process the chip value directly
      // by triggering the same flow as a real voice result
      handleDirectAnswer(parsed)
    }
  }

  // ── Direct answer injection (from chip taps) ──────────────────────────────────
  const handleDirectAnswer = useCallback((value) => {
    // Stop current listen phase
    try { recRef.current?.abort() } catch(_) {}

    const q = fitQuestions[voiceIdx]
    const bName = brandsList[brandIdx] || ""

    const confirmText = q.confirmMsg
      .replace("{val}", value)
      .replace("{brand}", bName)

    // Save answer then continue chain
    if (q.key === "brands") {
      const brandsArr = Array.isArray(value) ? value : [value]
      setBrandsList(brandsArr)
      setBrandIdx(0)
      setVoiceAnswers(prev => ({ ...prev, brands: brandsArr }))
    } else if (q.key === "brandSizes") {
      setVoiceAnswers(prev => {
        const sizes = { ...(prev.brandSizes || {}), [bName]: value }
        return { ...prev, brandSizes: sizes }
      })
    } else {
      setVoiceAnswers(prev => ({ ...prev, [q.key]: value }))
    }

    // Speak confirm then resume the chain from next index
    ;(async () => {
      abortRef.current = false
      setVoicePhase("confirming")
      await speak(confirmText)

      let nextIdx = voiceIdx
      let nextBIdx = brandIdx

      if (q.key === "brandSizes") {
        nextBIdx = brandIdx + 1
        if (nextBIdx < brandsList.length) {
          setBrandIdx(nextBIdx)
          await runVoiceChain(voiceIdx, brandsList, nextBIdx)
          return
        } else {
          nextIdx = voiceIdx + 1
        }
      } else if (q.key === "brands") {
        nextIdx = voiceIdx + 1
      } else {
        nextIdx = voiceIdx + 1
      }

      setVoiceIdx(nextIdx)
      await runVoiceChain(nextIdx, brandsList, 0)
    })()
  }, [voiceIdx, brandIdx, brandsList, speak, runVoiceChain])

  // ── Shared button style helpers ───────────────────────────────────────────────
  const btnPrimary = theme === "light"
    ? "bg-zinc-900 hover:bg-black text-white"
    : "bg-black border border-zinc-800 hover:bg-zinc-900 text-white"

  const btnSecondary = theme === "light"
    ? "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
    : "border border-zinc-800 bg-zinc-950/40 text-zinc-350 hover:border-zinc-700"

  const cardBg = theme === "light"
    ? "backdrop-blur-md bg-white/85 border-zinc-300 text-zinc-900 shadow-zinc-300/80"
    : "backdrop-blur-md bg-black/65 border-zinc-800/80 text-zinc-100"

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={`relative min-h-screen w-screen overflow-hidden flex flex-col items-center justify-center font-sans antialiased transition-colors duration-500 ${
      theme === "light" ? "bg-zinc-100 text-zinc-800" : "bg-black text-zinc-100"
    }`}>

      {/* Background canvas */}
      <div className="absolute inset-0 z-0">
        <PromptingIsAllYouNeed theme={theme} />
        <div className={`absolute inset-0 pointer-events-none ${
          theme === "light" ? "bg-zinc-100/50" : "bg-black/45"
        }`} />
      </div>

      {/* Header */}
      <header className="absolute top-6 left-0 right-0 z-20 flex justify-between items-center px-8 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className={`font-extrabold text-lg tracking-[0.2em] ${
            theme === "light" ? "text-zinc-900" : "bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400"
          }`}>JACKIE JEANS</span>
          <span className={`text-[10px] uppercase font-bold tracking-widest border rounded px-1.5 py-0.5 ${
            theme === "light" ? "text-zinc-800 border-zinc-400 bg-white/70" : "text-zinc-500 border-zinc-800/80 bg-black/40"
          }`}>Smart Fit</span>
        </div>
        <button
          onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
          className={`pointer-events-auto p-2 rounded-full border transition-all hover:scale-110 cursor-pointer shadow-md ${
            theme === "light" ? "bg-white border-zinc-300 text-zinc-900" : "bg-zinc-900 border-zinc-800 text-zinc-200"
          }`}
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </header>

      {/* Landing CTA */}
      {!isOnboardingOpen && (
        <div className="absolute bottom-[20%] left-0 right-0 z-10 flex justify-center px-4">
          <button
            onClick={() => { resetManual(); setState(0); setIsOnboardingOpen(true) }}
            className={`px-8 py-3.5 border rounded-full font-bold text-xs tracking-widest uppercase transition-all hover:scale-105 cursor-pointer shadow-md ${
              theme === "light"
                ? "bg-zinc-900 border-zinc-900 text-white"
                : "bg-white/10 hover:bg-white border-white/20 hover:border-white text-white hover:text-black"
            }`}
          >Start Onboarding</button>
        </div>
      )}

      {/* ── Onboarding Card ── */}
      {isOnboardingOpen && (
        <main className={`max-w-md w-[calc(100%-2rem)] mx-auto border rounded-2xl p-6 shadow-2xl relative z-10 transition-all duration-500 ${cardBg}`}>

          {/* Close */}
          <button
            onClick={() => { stopAll(); setIsOnboardingOpen(false) }}
            className={`absolute top-4 right-4 z-20 p-1.5 rounded-full cursor-pointer ${
              theme === "light" ? "text-zinc-900 bg-white/60 hover:bg-zinc-200/60" : "text-zinc-100 bg-black/60 hover:bg-zinc-900/60"
            }`}
          ><X className="w-4 h-4" /></button>

          {/* Dynamic Visual Header */}
          {(!showSummarySlide && !(state === 1 && quizStep === 4) && !(state === 2 && voicePhase === "done")) && (
            <div className="relative h-32 -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-2xl border-b border-zinc-800/10 bg-zinc-950/20 shadow-inner">
              {Object.entries(visualImages).map(([key, url]) => {
                const activeKey = getStepVisual(state, quizStep, voiceIdx)
                const isSelected = activeKey === key
                return (
                  <img
                    key={key}
                    src={url}
                    alt={key}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none ${
                      isSelected 
                        ? theme === "light" ? "opacity-45" : "opacity-35"
                        : "opacity-0"
                    }`}
                  />
                )
              })}
              {/* Overlay Gradient to blend with background card colors */}
              <div className={`absolute inset-0 bg-gradient-to-t pointer-events-none ${
                theme === "light" ? "from-white via-white/10 to-transparent" : "from-black via-black/10 to-transparent"
              }`} />
            </div>
          )}

          {showSummarySlide ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-pulse">
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Glowing, rotating outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-emerald-500 border-l-transparent animate-spin" />
                <Sparkles className="w-10 h-10 text-purple-400 animate-bounce" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-emerald-400">
                  Profile Matched!
                </h2>
                <p className={`text-xs ${theme === "light" ? "text-zinc-600" : "text-zinc-400"}`}>
                  Calculating custom Jackie Jeans size...
                </p>
              </div>

              {sizeProfile && (
                <div className={`w-full p-4 rounded-xl border text-center space-y-3 font-mono ${
                  theme === "light" ? "bg-zinc-100/80 border-zinc-200" : "bg-zinc-950/85 border-zinc-900"
                }`}>
                  <div className="text-xs text-zinc-500">RECOMMENDED SIZE</div>
                  <div className="text-4xl font-extrabold text-white tracking-wider">
                    SIZE {sizeProfile.size}
                  </div>
                  <div className="text-xs text-emerald-400 font-bold tracking-widest uppercase">
                    {sizeProfile.cut}
                  </div>
                  {sizeProfile.curvyFit && (
                    <div className="inline-flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">
                      ✨ Curvy Fit Active
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ── State 0: Choose mode ── */}
              {state === 0 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2 mt-2">
                    <h2 className={`text-2xl font-bold tracking-tight ${theme === "light" ? "text-zinc-950" : "text-white"}`}>Smart Fit Onboarding</h2>
                    <p className={`text-sm ${theme === "light" ? "text-zinc-700" : "text-zinc-400"}`}>
                      Find your perfect pair using manual sliders or AI voice guidance.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => { resetManual(); setState(1) }}
                      className={`group flex flex-col items-center justify-center border rounded-xl p-5 text-center transition-all duration-300 cursor-pointer ${
                        theme === "light"
                          ? "border-zinc-300 bg-white hover:border-zinc-400"
                          : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80"
                      }`}
                    >
                      <div className={`w-12 h-12 flex items-center justify-center rounded-lg border mb-3 ${
                        theme === "light" ? "bg-zinc-50 border-zinc-300 text-zinc-600" : "bg-zinc-950 border-zinc-800 text-zinc-400 group-hover:text-zinc-200"
                      }`}><Sliders className="w-5 h-5" /></div>
                      <h3 className={`font-bold text-sm ${theme === "light" ? "text-zinc-900" : "text-zinc-200 group-hover:text-white"}`}>Manual Quiz</h3>
                      <p className={`text-[11px] mt-1 ${theme === "light" ? "text-zinc-500" : "text-zinc-500"}`}>Adjust sliders and dropdowns.</p>
                    </button>

                    <button
                      onClick={() => {
                        warmUpSynth()
                        setVoiceAnswers({})
                        setBrandsList([])
                        setBrandIdx(0)
                        setVoiceIdx(0)
                        setAiCaption("")
                        setUserCaption("")
                        setMicBlocked(false)
                        setIsMuted(false)
                        isMutedRef.current = false
                        setState(2)
                        // Start chain after React re-renders (next tick)
                        setTimeout(() => runVoiceChain(0, [], 0), 80)
                      }}
                      className={`group flex flex-col items-center justify-center border rounded-xl p-5 text-center transition-all duration-300 cursor-pointer ${
                        theme === "light"
                          ? "border-zinc-300 bg-white hover:border-zinc-400"
                          : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80"
                      }`}
                    >
                      <div className={`w-12 h-12 flex items-center justify-center rounded-lg border mb-3 ${
                        theme === "light"
                          ? "bg-zinc-50 border-zinc-300 text-zinc-600 group-hover:text-purple-700"
                          : "bg-zinc-950 border-zinc-850 text-zinc-400 group-hover:text-purple-400"
                      }`}><Sparkles className="w-5 h-5" /></div>
                      <h3 className={`font-bold text-sm ${theme === "light" ? "text-zinc-900" : "text-zinc-200 group-hover:text-white"}`}>Voice Stylist</h3>
                      <p className={`text-[11px] mt-1 ${theme === "light" ? "text-zinc-500" : "text-zinc-500"}`}>Speak to your AI stylist.</p>
                    </button>
                  </div>

                  <div className={`flex items-center gap-2 border-t pt-4 text-[10px] justify-center ${
                    theme === "light" ? "border-zinc-200 text-zinc-500" : "border-zinc-900 text-zinc-500"
                  }`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Data processed instantly & securely</span>
                  </div>
                </div>
              )}

              {/* ── State 1: Manual quiz ── */}
              {state === 1 && (
                <div className="space-y-5">
                  <div className={`flex items-center justify-between border-b pb-3 pr-8 ${theme === "light" ? "border-zinc-200" : "border-zinc-900"}`}>
                    <button onClick={() => setState(0)} className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${theme === "light" ? "text-zinc-600 hover:text-zinc-900" : "text-zinc-400 hover:text-white"}`}>
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <span className={`text-xs font-mono font-bold ${theme === "light" ? "text-zinc-500" : "text-zinc-500"}`}>Step {quizStep} of 4</span>
                  </div>

                  {quizStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className={`text-lg font-bold ${theme === "light" ? "text-zinc-950" : "text-white"}`}>Select Your Fit Profile</h2>
                        <p className={`text-xs ${theme === "light" ? "text-zinc-600" : "text-zinc-400"}`}>Choose how snug you prefer your denim.</p>
                      </div>
                      <div className="space-y-2">
                        {["Snug","Regular","Relaxed"].map(fit => (
                          <button key={fit} onClick={() => setQuizData({...quizData, fit})}
                            className={`w-full flex items-center justify-between p-3.5 rounded-lg border text-sm transition-all cursor-pointer ${
                              quizData.fit === fit
                                ? theme === "light" ? "border-zinc-900 bg-zinc-900/10 text-zinc-950 font-bold" : "border-white bg-white/5 text-white"
                                : theme === "light" ? "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400" : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                            }`}
                          >
                            <span>{fit} Fit</span>
                            {quizData.fit === fit && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setQuizStep(2)} className={`w-full py-2.5 font-bold rounded-lg text-sm transition-all cursor-pointer ${btnPrimary}`}>Continue</button>
                    </div>
                  )}

                  {quizStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className={`text-lg font-bold ${theme === "light" ? "text-zinc-950" : "text-white"}`}>Size Dimensions</h2>
                        <p className={`text-xs ${theme === "light" ? "text-zinc-600" : "text-zinc-400"}`}>Set your waist, hip, and inseam measurements.</p>
                      </div>
                      {[["waist","Waist","28","44"],["hip","Hip","30","52"],["length","Inseam","28","36"]].map(([k, label, min, max]) => (
                        <div key={k} className="space-y-1.5">
                          <div className={`flex justify-between text-xs font-semibold ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>
                            <span>{label}:</span>
                            <span className={`font-mono font-bold ${theme === "light" ? "text-zinc-950" : "text-white"}`}>{quizData[k]}"</span>
                          </div>
                          <input type="range" min={min} max={max} value={quizData[k]}
                            onChange={e => setQuizData({...quizData, [k]: parseInt(e.target.value)})}
                            className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${theme === "light" ? "bg-zinc-300 accent-zinc-900" : "bg-zinc-850 accent-white"}`}
                          />
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button onClick={() => setQuizStep(1)} className={`py-2.5 rounded-lg text-sm font-semibold cursor-pointer ${btnSecondary}`}>Back</button>
                        <button onClick={() => setQuizStep(3)} className={`py-2.5 rounded-lg text-sm font-bold cursor-pointer ${btnPrimary}`}>Continue</button>
                      </div>
                    </div>
                  )}

                  {quizStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className={`text-lg font-bold ${theme === "light" ? "text-zinc-950" : "text-white"}`}>Fabric & Wash</h2>
                        <p className={`text-xs ${theme === "light" ? "text-zinc-600" : "text-zinc-400"}`}>Pick your wash and stretch preference.</p>
                      </div>
                      {[
                        ["wash","Jeans Wash",["Raw Indigo","Dark Indigo (Rinsed)","Vintage Blue","Charcoal Black"],["Raw Indigo","Dark Indigo","Vintage Wash","Charcoal Black"]],
                        ["stretch","Stretch Profile",["Rigid (100% Cotton)","Comfort Stretch (2% Lycra)","Active Performance (4% Flex)"],["Rigid (100% Cotton)","Comfort Stretch","Active Stretch"]]
                      ].map(([k, label, labels, values]) => (
                        <div key={k} className="space-y-1">
                          <label className={`text-[11px] uppercase tracking-widest font-bold ${theme === "light" ? "text-zinc-600" : "text-zinc-400"}`}>{label}</label>
                          <select value={quizData[k]} onChange={e => setQuizData({...quizData, [k]: e.target.value})}
                            className={`w-full border rounded-lg p-2.5 text-sm font-semibold focus:outline-none ${
                              theme === "light" ? "bg-white border-zinc-300 text-zinc-900" : "bg-zinc-950/80 border-zinc-850 text-zinc-300"
                            }`}
                          >
                            {labels.map((l,i) => <option key={l} value={values[i]}>{l}</option>)}
                          </select>
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button onClick={() => setQuizStep(2)} className={`py-2.5 rounded-lg text-sm font-semibold cursor-pointer ${btnSecondary}`}>Back</button>
                        <button onClick={submitManualQuiz} disabled={submittingQuiz}
                          className={`py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${btnPrimary}`}
                        >
                          {submittingQuiz ? <><RefreshCw className="w-3.5 h-3.5 animate-spin"/>Processing</> : "Calculate Fit"}
                        </button>
                      </div>
                    </div>
                  )}

                  {quizStep === 4 && quizResult && (
                    <div className="space-y-4">
                      <div className="text-center space-y-1">
                        <div className={`inline-flex items-center gap-1.5 text-[11px] uppercase font-mono tracking-widest border rounded-full px-3 py-1 font-bold ${
                          theme === "light" ? "bg-zinc-100 border-zinc-300 text-zinc-700" : "bg-zinc-950 border-zinc-900 text-zinc-400"
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"/>
                          {quizResult.matchScore}% Match Found
                        </div>
                        <h2 className={`text-xl font-bold ${theme === "light" ? "text-zinc-950" : "text-white"}`}>{quizResult.name}</h2>
                        <p className={`text-xs font-bold ${theme === "light" ? "text-zinc-600" : "text-zinc-400"}`}>{quizResult.model}</p>
                      </div>
                      <div className={`relative aspect-video rounded-xl overflow-hidden border ${theme === "light" ? "border-zinc-300" : "border-zinc-800"}`}>
                        <img src={quizResult.imageUrl} alt={quizResult.name} className="object-cover w-full h-full opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"/>
                        <span className={`absolute bottom-3 right-3 font-mono font-bold border px-2 py-0.5 rounded ${
                          theme === "light" ? "bg-white border-zinc-300 text-zinc-950" : "bg-zinc-950/90 border-zinc-800 text-white"
                        }`}>{quizResult.price}</span>
                      </div>
                      <p className={`text-xs italic text-center p-3 rounded-lg border ${
                        theme === "light" ? "bg-zinc-100/60 border-zinc-300 text-zinc-700" : "bg-zinc-950/30 border-zinc-900 text-zinc-400"
                      }`}>"{quizResult.description}"</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={resetManual} className={`py-2.5 rounded-lg text-sm font-semibold cursor-pointer ${btnSecondary}`}>Retake Quiz</button>
                        <button onClick={() => setIsOnboardingOpen(false)} className={`py-2.5 rounded-lg text-sm font-bold cursor-pointer ${btnPrimary}`}>Finished</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── State 2: Voice Stylist ── */}
              {state === 2 && (
                <div className="space-y-5">
                  {/* Header */}
                  <div className={`flex items-center justify-between border-b pb-3 pr-8 ${theme === "light" ? "border-zinc-200" : "border-zinc-900"}`}>
                    <button onClick={() => { stopAll(); setState(0) }}
                      className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer ${theme === "light" ? "text-zinc-600 hover:text-zinc-900" : "text-zinc-400 hover:text-white"}`}>
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${theme === "light" ? "text-zinc-600" : "text-zinc-400"}`}>
                      <Volume2 className="w-3.5 h-3.5" /> AI Voice Stylist
                    </div>
                  </div>

                  {/* Mic blocked warning */}
                  {micBlocked ? (
                    <div className="text-center space-y-4 py-4">
                      <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                      <h3 className={`font-bold ${theme === "light" ? "text-zinc-950" : "text-white"}`}>Microphone Blocked</h3>
                      <p className={`text-xs max-w-xs mx-auto ${theme === "light" ? "text-zinc-600" : "text-zinc-400"}`}>
                        Please allow microphone access in your browser settings, then click Retry.
                      </p>
                      <button onClick={() => { setMicBlocked(false); runVoiceChain(voiceIdx, brandsList, brandIdx) }}
                        className={`px-6 py-2 rounded-lg text-xs font-bold cursor-pointer ${btnPrimary}`}>Retry</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-4">

                      {/* ── DONE: Result card ── */}
                      {voicePhase === "done" ? (() => {
                        const result = matchVoiceResult(voiceAnswers)
                        return (
                          <div className="w-full space-y-4 animate-fade-in">
                            {/* Badge */}
                            <div className="text-center space-y-1">
                              <div className={`inline-flex items-center gap-1.5 text-[11px] uppercase font-mono tracking-widest border rounded-full px-3 py-1 font-bold ${
                                theme === "light" ? "bg-zinc-100 border-zinc-300 text-zinc-700" : "bg-zinc-950 border-zinc-900 text-zinc-400"
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"/>
                                {result.matchScore}% Match Found
                              </div>
                              <h2 className={`text-xl font-bold ${theme === "light" ? "text-zinc-950" : "text-white"}`}>{result.name}</h2>
                              <p className={`text-xs font-bold ${theme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>{result.model}</p>
                            </div>

                            {/* Photo */}
                            <div className={`relative aspect-video rounded-xl overflow-hidden border ${
                              theme === "light" ? "border-zinc-300" : "border-zinc-800"
                            }`}>
                              <img src={result.imageUrl} alt={result.name} className="object-cover w-full h-full opacity-90"/>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"/>
                              <span className={`absolute bottom-3 right-3 font-mono font-bold text-sm border px-2 py-0.5 rounded ${
                                theme === "light" ? "bg-white border-zinc-300 text-zinc-950" : "bg-black/80 border-zinc-700 text-white"
                              }`}>{result.price}</span>
                            </div>

                            {/* Description */}
                            <p className={`text-xs italic text-center p-3 rounded-lg border leading-relaxed ${
                              theme === "light" ? "bg-zinc-100/60 border-zinc-300 text-zinc-700" : "bg-zinc-950/40 border-zinc-900 text-zinc-400"
                            }`}>"{result.description}"</p>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => {
                                  stopAll()
                                  setTimeout(() => {
                                    abortRef.current = false
                                    setVoiceAnswers({})
                                    setBrandsList([])
                                    setBrandIdx(0)
                                    setVoiceIdx(0)
                                    setAiCaption("")
                                    setUserCaption("")
                                    warmUpSynth()
                                    setTimeout(() => runVoiceChain(0, [], 0), 80)
                                  }, 200)
                                }}
                                className={`py-2.5 rounded-lg text-sm font-semibold cursor-pointer ${btnSecondary}`}
                              >Retake Quiz</button>
                              <button
                                onClick={() => setIsOnboardingOpen(false)}
                                className={`py-2.5 rounded-lg text-sm font-bold cursor-pointer ${btnPrimary}`}
                              >Finished</button>
                            </div>
                          </div>
                        )
                      })() : (
                      <div className="text-center">
                        <h3 className={`text-base font-bold uppercase tracking-wider ${theme === "light" ? "text-zinc-950" : "text-white"}`}>
                          {voicePhase === "speaking"   && "Stylist Speaking…"}
                          {voicePhase === "listening"  && "Listening…"}
                          {voicePhase === "confirming" && "Got it!"}
                          {voicePhase === "idle"       && "Ready"}
                        </h3>
                        <p className={`text-[11px] font-mono font-bold mt-0.5 ${theme === "light" ? "text-zinc-500" : "text-zinc-500"}`}>
                          Question {Math.min(voiceIdx + 1, fitQuestions.length)} of {fitQuestions.length}
                        </p>
                      </div>
                      )}

                      {/* Mute toggle */}
                      {voicePhase !== "done" && (
                        <div className={`w-full flex items-center justify-between border-t border-b py-2 ${theme === "light" ? "border-zinc-200" : "border-zinc-850"}`}>
                          <span className={`text-[10px] uppercase font-bold tracking-widest ${theme === "light" ? "text-zinc-500" : "text-zinc-500"}`}>AI Voice</span>
                          <button
                            onClick={() => { const m = !isMuted; setIsMuted(m); isMutedRef.current = m; if (m) window.speechSynthesis?.cancel() }}
                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase border transition-all cursor-pointer ${
                              isMuted
                                ? "bg-red-500/10 border-red-500 text-red-400"
                                : theme === "light" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-emerald-950/20 border-emerald-900 text-emerald-400"
                            }`}
                          >{isMuted ? "🔇 Muted" : "🔊 On"}</button>
                        </div>
                      )}

                      {/* Current question text */}
                      {voicePhase !== "idle" && voicePhase !== "done" && voiceIdx < fitQuestions.length && (
                        <div className="w-full border-l-2 border-purple-500 bg-purple-500/5 rounded-r-lg px-4 py-3">
                          <p className={`text-sm font-bold leading-relaxed ${theme === "light" ? "text-zinc-900" : "text-zinc-100"}`}>
                            {fitQuestions[voiceIdx].key === "brandSizes" && brandsList[brandIdx]
                              ? fitQuestions[voiceIdx].text.replace("{brand}", brandsList[brandIdx])
                              : fitQuestions[voiceIdx].text}
                          </p>
                        </div>
                      )}

                      {/* Quick-tap chip buttons */}
                      {voicePhase !== "done" && voiceIdx < chipOptions.length && (
                        <div className="flex flex-wrap gap-2 justify-center w-full">
                          {chipOptions[voiceIdx].map(val => (
                            <button key={val} onClick={() => handleChipTap(val.toString())}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                                theme === "light"
                                  ? "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-100"
                                  : "bg-black border-zinc-800 text-zinc-200 hover:bg-zinc-900"
                              }`}
                            >{val}</button>
                          ))}
                        </div>
                      )}

                      {/* Animated pulse orb */}
                      {voicePhase !== "done" && (
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                            voicePhase === "speaking"   ? "bg-blue-500" :
                            voicePhase === "listening"  ? "bg-emerald-500" :
                            voicePhase === "confirming" ? "bg-purple-500" : "bg-zinc-500"
                          }`}/>
                          <div className={`absolute inset-3 rounded-full ${
                            voicePhase === "speaking"   ? "bg-blue-600/10 shadow-[0_0_24px_rgba(59,130,246,0.4)]" :
                            voicePhase === "listening"  ? "bg-emerald-600/10 shadow-[0_0_24px_rgba(16,185,129,0.4)]" :
                            voicePhase === "confirming" ? "bg-purple-600/10 shadow-[0_0_24px_rgba(168,85,247,0.4)]" :
                            "bg-zinc-800/15"
                          }`}/>
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center z-10 border shadow-lg ${
                            theme === "light" ? "bg-white border-zinc-300" : "bg-black border-zinc-800"
                          }`}>
                            {voicePhase === "listening"  && <Mic className="w-7 h-7 text-emerald-500 animate-pulse"/>}
                            {voicePhase === "speaking"   && <Volume2 className="w-7 h-7 text-blue-500"/>}
                            {voicePhase === "confirming" && <Check className="w-7 h-7 text-purple-500"/>}
                            {voicePhase === "idle"       && <Mic className="w-7 h-7 text-zinc-400"/>}
                          </div>
                        </div>
                      )}

                      {/* Transcription box */}
                      {voicePhase !== "done" && (
                        <div className={`w-full border rounded-xl p-4 min-h-[96px] text-xs space-y-2 font-mono ${
                          theme === "light" ? "bg-zinc-100/60 border-zinc-300" : "bg-zinc-950/80 border-zinc-900"
                        }`}>
                          <div className={`text-[9px] uppercase tracking-widest font-bold ${theme === "light" ? "text-zinc-500" : "text-zinc-650"}`}>Transcription</div>
                          <div>
                            <span className={`font-bold ${theme === "light" ? "text-blue-700" : "text-blue-400"}`}>Stylist: </span>
                            <span className={theme === "light" ? "text-zinc-900" : "text-zinc-100"}>
                              {aiCaption || "Session will begin once you choose Voice Stylist…"}
                            </span>
                          </div>
                          {voicePhase !== "idle" && (
                            <div>
                              <span className={`font-bold ${theme === "light" ? "text-emerald-700" : "text-emerald-400"}`}>You: </span>
                              <span className={`italic ${theme === "light" ? "text-zinc-800" : "text-zinc-300"}`}>
                                {userCaption || (voicePhase === "listening" ? "Listening…" : "—")}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action row */}
                      {voicePhase !== "done" && (
                        <div className="flex w-full justify-between items-center pt-1">
                          <button
                            onClick={() => {
                              stopAll()
                              setTimeout(() => {
                                abortRef.current = false
                                setVoiceAnswers({})
                                setBrandsList([])
                                setBrandIdx(0)
                                setVoiceIdx(0)
                                setAiCaption("")
                                setUserCaption("")
                                warmUpSynth()
                                setTimeout(() => runVoiceChain(0, [], 0), 80)
                              }, 200)
                            }}
                            className={`text-xs flex items-center gap-1 cursor-pointer font-semibold ${
                              theme === "light" ? "text-zinc-600 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            <RefreshCw className="w-3.5 h-3.5"/> Restart
                          </button>

                          {!isMuted && (
                            <button onClick={() => { window.speechSynthesis?.cancel(); setTimeout(() => runVoiceChain(voiceIdx, brandsList, brandIdx), 200) }}
                              className={`text-xs flex items-center gap-1 cursor-pointer font-semibold ${
                                theme === "light" ? "text-zinc-600 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              <Play className="w-3 h-3"/> Resume
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Live Summary Sidebar / Bottom Bar ── */}
              {renderLiveSummary()}

              {/* ── Inline Manual Editor Overlay ── */}
              {editingField && (
                <div className={`absolute inset-0 rounded-2xl p-6 flex flex-col justify-between z-30 animate-fade-in ${
                  theme === "light" ? "bg-white/95 backdrop-blur-md" : "bg-black/95 backdrop-blur-md"
                }`}>
                  <div className="space-y-4">
                    <div className={`flex justify-between items-center border-b pb-2 ${
                      theme === "light" ? "border-zinc-200" : "border-zinc-800"
                    }`}>
                      <h3 className={`text-sm font-bold uppercase tracking-wider ${
                        theme === "light" ? "text-purple-700" : "text-purple-400"
                      }`}>
                        Edit {editingField.toUpperCase()}
                      </h3>
                      <button onClick={() => { setEditingField(null); setEditingValue(null) }} className="text-zinc-500 hover:text-zinc-350">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="py-4">
                      {renderEditorInput()}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setEditingField(null); setEditingValue(null) }} className={`flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer ${btnSecondary}`}>
                      Cancel
                    </button>
                    <button onClick={saveEditedField} className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer ${btnPrimary}`}>
                      Save & Resume
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      )}

      <footer className="absolute bottom-4 left-0 right-0 z-20 text-center pointer-events-none">
        <span className={`text-[10px] font-mono tracking-widest font-semibold ${theme === "light" ? "text-zinc-500" : "text-zinc-600"}`}>
          © {new Date().getFullYear()} JACKIE JEANS CO. ALL RIGHTS RESERVED.
        </span>
      </footer>
    </div>
  )
}
