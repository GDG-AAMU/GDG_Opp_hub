import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY || ""

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function parseJobPosting(content: string) {
  if (!genAI) {
    throw new Error("Gemini API key not configured")
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" })

  const prompt = `Extract the following information from this job posting:

Job Posting Content: ${content}

Extract and return as JSON:
{
  "company_name": "string",
  "job_title": "string",
  "opportunity_type": "internship|full_time|research|fellowship|scholarship",
  "role_type": "Software Engineering|Product Management|Data Science|etc.",
  "relevant_majors": ["Computer Science", "Software Engineering", ...],
  "deadline": "YYYY-MM-DD or null",
  "requirements": "string",
  "location": "string",
  "description": "string"
}

If any field cannot be determined, use null.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    throw new Error("Failed to parse AI response")
  } catch (error) {
    console.error("Error parsing job posting:", error)
    throw error
  }
}

