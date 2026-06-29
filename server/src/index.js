import express from "express"
import cors from "cors"

const app = express()
const PORT = process.env.PORT || 5001

app.use(cors())
app.use(express.json())

// Database of Jackie Jeans denim models
const denimCatalog = [
  {
    id: "raw-slim",
    name: "Jackie Raw Indigo Slim",
    model: "Model D-01 Slim Fit",
    fits: ["Skinny", "Slim"],
    washes: ["Raw Indigo", "Dark Indigo"],
    description: "Tailored slim through the thigh with a tapered hem. Crafted from heavy Japanese raw indigo selvedge denim.",
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop",
    price: "$148"
  },
  {
    id: "classic-straight",
    name: "Jackie Classic Straight",
    model: "Model D-02 Straight Fit",
    fits: ["Straight"],
    washes: ["Raw Indigo", "Dark Indigo", "Vintage Wash"],
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
    description: "Extra room in the seat and thigh for all-day comfort. Made with our premium Active Stretch custom weave.",
    imageUrl: "https://images.unsplash.com/photo-1582552945292-e01a5297f1f8?q=80&w=600&auto=format&fit=crop",
    price: "$148"
  },
  {
    id: "athletic-taper",
    name: "Jackie Athletic Tapered",
    model: "Model D-03 Athletic Fit",
    fits: ["Straight", "Relaxed"],
    washes: ["Dark Indigo", "Charcoal Black"],
    description: "Designed for muscular builds: roomy through the hips and thighs, with a smart taper down to the ankle.",
    imageUrl: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=600&auto=format&fit=crop",
    price: "$158"
  }
]

// Root health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Jackie Jeans Onboarding API" })
})

// Endpoint 1: Manual Onboarding Quiz
app.post("/api/onboarding", (req, res) => {
  const { fit, waist, length, wash, stretch } = req.body

  console.log(`Received manual quiz onboarding request:`, { fit, waist, length, wash, stretch })

  // Find matches scoring based on fit and wash
  let bestMatch = denimCatalog.find(d => d.fits.includes(fit))
  
  // Default fallback if no fit match
  if (!bestMatch) {
    bestMatch = denimCatalog[1] // Classic Straight
  }

  // Calculate matching score simulation (from 90% to 100%)
  const matchScore = Math.floor(Math.random() * 11) + 90 

  res.json({
    success: true,
    match: {
      ...bestMatch,
      matchScore
    }
  })
})

// Endpoint 2: AI Voice Stylist
app.post("/api/voice-stylist", (req, res) => {
  const { transcript } = req.body

  console.log(`Received voice transcription: "${transcript}"`)

  const text = (transcript || "").toLowerCase()
  let selectedDenim = denimCatalog[1] // Default: Classic Straight

  // Quick keyword analysis
  if (text.includes("slim") || text.includes("skinny") || text.includes("tight")) {
    selectedDenim = denimCatalog[0] // Raw Slim
  } else if (text.includes("relaxed") || text.includes("loose") || text.includes("comfort")) {
    selectedDenim = denimCatalog[2] // Relaxed Comfort
  } else if (text.includes("athletic") || text.includes("taper") || text.includes("muscular")) {
    selectedDenim = denimCatalog[3] // Athletic Taper
  }

  const matchScore = Math.floor(Math.random() * 11) + 89 

  res.json({
    success: true,
    match: {
      ...selectedDenim,
      matchScore
    }
  })
})

app.listen(PORT, () => {
  console.log(`Jackie Jeans Backend Server listening on port ${PORT}`)
})
