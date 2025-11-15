import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // TODO: Implement submit opportunity with AI parsing
  const body = await request.json()
  return NextResponse.json({ 
    message: "Submit opportunity with AI parsing - Coming soon",
    data: body 
  })
}

