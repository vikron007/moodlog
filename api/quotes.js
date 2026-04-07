export default async function handler(req, res) {
  try {
    const response = await fetch("https://zenquotes.io/api/today")
    const data = await response.json()
    res.status(200).json({
      quote: data[0].q,
      author: data[0].a
    })
  } catch {
    res.status(500).json({
      quote: "Every day is a fresh start.",
      author: "Unknown"
    })
  }
}