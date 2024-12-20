"use server"

import { PaidTierNames, subscriptionTiers } from "@/data/subscriptionTiers"
import { auth, currentUser, User } from "@clerk/nextjs/server"
import { getUserSubscription } from "../db/subscription"
import { Stripe } from "stripe"
import { env as serverEnv } from "@/data/env/server"
import { env as clientEnv } from "@/data/env/client"
import { redirect } from "next/navigation"

const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY)

export async function createCancelSession() {
  const user = await currentUser()
  // if (!user) return { error: true }
  if (!user) throw new Error()

  const subscription = await getUserSubscription(user.id)
  // if (!subscription) return { error: true }
  if (!subscription) throw new Error()

  if (!subscription.stripeCustomerId || !subscription.stripeSubscriptionId) {
    // return new Response(null, { status: 500 })
    throw new Error()
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
    flow_data: {
      type: "subscription_cancel",
      subscription_cancel: {
        subscription: subscription.stripeSubscriptionId,
      },
    },
  })

  redirect(portalSession.url)
}

export async function createCustomerPortalSession() {
  const { userId } = await auth()

  // if (!userId) return { error: true }
  if (!userId) throw new Error()

  const subscription = await getUserSubscription(userId)

  // if (!subscription?.stripeCustomerId) return { error: true }
  if (!subscription?.stripeCustomerId) throw new Error()

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
  })

  redirect(portalSession.url)
}

export async function createCheckoutSession(tier: PaidTierNames) {
  const user = await currentUser()
  // if (!user) return { error: true }
  if (!user) throw new Error()

  const subscription = await getUserSubscription(user.id)

  // if (!subscription) return { error: true }
  if (!subscription) throw new Error()

  if (subscription.stripeCustomerId == null) {
    const url = await getCheckoutSession(tier, user)

    // if (!url) return { error: true }
    if (!url) throw new Error()
    redirect(url)
  } else {
    const url = await getSubscriptionUpgradeSession(tier, subscription)
    redirect(url)
  }
}

async function getCheckoutSession(tier: PaidTierNames, user: User) {
  const session = await stripe.checkout.sessions.create({
    customer_email: user.primaryEmailAddress?.emailAddress,
    subscription_data: {
      metadata: {
        clerkUserId: user.id,
      },
    },
    line_items: [
      {
        price: subscriptionTiers[tier].stripePriceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
    cancel_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
  })

  return session.url
}

async function getSubscriptionUpgradeSession(
  tier: PaidTierNames,
  subscription: {
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    stripeSubscriptionItemId: string | null
  }
) {
  if (
    !subscription.stripeCustomerId ||
    !subscription.stripeSubscriptionId ||
    !subscription.stripeSubscriptionItemId
  ) {
    throw new Error()
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
    flow_data: {
      type: "subscription_update_confirm",
      subscription_update_confirm: {
        subscription: subscription.stripeSubscriptionId,
        items: [
          {
            id: subscription.stripeSubscriptionItemId,
            price: subscriptionTiers[tier].stripePriceId,
            quantity: 1,
          },
        ],
      },
    },
  })

  return portalSession.url
}
