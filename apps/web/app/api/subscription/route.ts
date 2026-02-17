import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { dodo } from "@/lib/dodo"

export async function GET() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findFirst({
    where: { googleId: clerkUserId },
    select: { id: true, email: true, dodoCustomerId: true },
  })

  let customerId = user?.dodoCustomerId

  // Self-heal: if dodoCustomerId is missing, look up by email in Dodo
  if (!customerId && user?.email) {
    try {
      const customers = await dodo.customers.list({ email: user.email })
      const items = []
      for await (const c of customers) {
        items.push(c)
      }
      if (items.length > 0) {
        customerId = items[0]!.customer_id
        await prisma.user.update({
          where: { id: user.id },
          data: { dodoCustomerId: customerId },
        })
      }
    } catch {
      // Dodo lookup failed — fall through to no plan
    }
  }

  if (!customerId) {
    return NextResponse.json({ plan: null })
  }

  const subscriptions = await dodo.subscriptions.list({
    customer_id: customerId,
    status: "active",
  })

  const subItems = []
  for await (const sub of subscriptions) {
    subItems.push(sub)
  }

  if (subItems.length === 0) {
    return NextResponse.json({
      plan: null,
      customerId,
    })
  }

  const activeSub = subItems[0]!
  return NextResponse.json({
    plan: "player",
    customerId,
    subscription: {
      id: activeSub.subscription_id,
      status: activeSub.status,
      productId: activeSub.product_id,
      nextBillingDate: activeSub.next_billing_date,
    },
  })
}
