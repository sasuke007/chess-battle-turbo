import { Webhooks } from "@dodopayments/nextjs"
import { prisma } from "@/lib/prisma"

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,

  onSubscriptionActive: async (payload) => {
    const { customer } = payload.data
    if (customer?.email) {
      await prisma.user.updateMany({
        where: { email: customer.email, dodoCustomerId: null },
        data: { dodoCustomerId: customer.customer_id },
      })
    }
  },

  onPaymentSucceeded: async (payload) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[Dodo] Payment succeeded:", payload.data.payment_id)
    }
    const { customer } = payload.data
    if (customer?.email) {
      await prisma.user.updateMany({
        where: { email: customer.email, dodoCustomerId: null },
        data: { dodoCustomerId: customer.customer_id },
      })
    }
  },

  onSubscriptionCancelled: async (payload) => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[Dodo] Subscription cancelled:",
        payload.data.subscription_id,
      )
    }
  },

  onSubscriptionRenewed: async (payload) => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[Dodo] Subscription renewed:",
        payload.data.subscription_id,
      )
    }
  },
})
