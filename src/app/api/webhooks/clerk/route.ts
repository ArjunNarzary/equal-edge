import { Webhook } from "svix"
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { env } from "@/data/env/server"
import { createUserSubscription } from "@/server/db/subscription"
import { deleteUser } from "@/server/db/users"

export async function POST(req: Request) {
  // Get headers
  const headerPayload = await headers()
  const svixId = headerPayload.get("svix-id")
  const svixTimestamp = headerPayload.get("svix-timestamp")
  const svixSignature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  //   Create new Svix instance with secret
  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET)

  let event: WebhookEvent

  // Verify payload with headers
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new Response("Error occured", {
      status: 400,
    })
  }

  switch (event.type) {
    case "user.created": {
      //Create User
      await createUserSubscription({
        clerkUserId: event.data.id,
        tier: "Free",
      })
      break
    }

    case "user.deleted": {
      if (event.data.id) {
        await deleteUser(event.data.id)
        //TODO: Remove stripe subscription
      }
    }
  }

  return new Response("Webhook received", { status: 200 })
}
