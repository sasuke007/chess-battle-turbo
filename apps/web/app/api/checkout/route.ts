import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { dodo } from "@/lib/dodo"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { productId, email, name, metadata } = await req.json()

  if (!productId || !email) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    )
  }

  try {
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email, name },
      metadata,
      return_url: process.env.DODO_PAYMENTS_RETURN_URL,
    })

    return NextResponse.json({
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
    })
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[checkout] Dodo API error:', err)
    }
    const message = err instanceof Error ? err.message : "Failed to create checkout session"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
