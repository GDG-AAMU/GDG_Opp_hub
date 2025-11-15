import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // TODO: Implement GET single opportunity
  return NextResponse.json({ 
    message: "GET opportunity by ID - Coming soon",
    id: params.id 
  })
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // TODO: Implement PUT update opportunity (admin only)
  return NextResponse.json({ 
    message: "PUT update opportunity - Coming soon",
    id: params.id 
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // TODO: Implement DELETE opportunity (admin only)
  return NextResponse.json({ 
    message: "DELETE opportunity - Coming soon",
    id: params.id 
  })
}

