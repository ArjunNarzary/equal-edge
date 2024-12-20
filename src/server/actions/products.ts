"use server"

import {
  productCountryDiscountsSchema,
  productCustomizationSchema,
  productDetailsSchema,
} from "@/schemas/products"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import {
  createProduct as createProductDb,
  updateProduct as updateProductDb,
  deleteProduct as deleteProductDb,
  updateCountryDiscount as updateCountryDiscountsDb,
  updateProductCustomization as updateProductCustomizationDb,
} from "../db/products"
import { redirect } from "next/navigation"
import { canCreateProduct, canCustomizeBanner } from "../permissions"

export async function createProduct(
  unsafeData: z.infer<typeof productDetailsSchema>
): Promise<{ error: boolean; message: string } | undefined> {
  const { userId } = await auth()
  const { success, data } = productDetailsSchema.safeParse(unsafeData)
  const canCreate = await canCreateProduct(userId)

  if (!success || !userId || !canCreate) {
    return { error: true, message: "There was an error creating your product" }
  }

  const { id } = await createProductDb({ ...data, clerkUserId: userId })

  redirect(`/dashboard/products/${id}/edit?tab=countries`)
}

export async function updateProduct(
  id: string,
  unsafeData: z.infer<typeof productDetailsSchema>
): Promise<{ error: boolean; message: string } | undefined> {
  const { userId } = await auth()
  const { success, data } = productDetailsSchema.safeParse(unsafeData)
  const errorMessage = "There was an error updating your product"

  if (!success || !userId) {
    return { error: true, message: errorMessage }
  }

  const isSuccess = await updateProductDb(data, { id, userId })

  return {
    error: !isSuccess,
    message: isSuccess ? "Product details updated" : errorMessage,
  }
}

export async function deleteProduct(id: string) {
  const { userId } = await auth()
  const errorMessage = "There was an error deleting your product"

  if (userId == null) {
    return { error: true, message: errorMessage }
  }

  const isSuccess = await deleteProductDb({ id, userId })

  return {
    error: !isSuccess,
    message: isSuccess ? "Successfully deleted your product" : errorMessage,
  }
}

export async function updateCountryDiscounts(
  productId: string,
  unsafeData: z.infer<typeof productCountryDiscountsSchema>
) {
  const { userId } = await auth()
  const { success, data } = productCountryDiscountsSchema.safeParse(unsafeData)

  if (!success || userId == null) {
    return {
      error: true,
      message: "There was an error saving your country discounts",
    }
  }

  const insert: {
    countryGroupId: string
    productId: string
    coupon: string
    discountPercentage: number
  }[] = []
  const deleteIds: { countryGroupId: string }[] = []
  data.groups.forEach((group) => {
    if (
      group.coupon &&
      group.coupon.length > 0 &&
      group.discountPercentage &&
      group.discountPercentage > 0
    ) {
      insert.push({
        countryGroupId: group.countryGroupId,
        coupon: group.coupon,
        discountPercentage: group.discountPercentage / 100,
        productId,
      })
    } else {
      deleteIds.push({ countryGroupId: group.countryGroupId })
    }
  })
  await updateCountryDiscountsDb(deleteIds, insert, { productId, userId })

  return { error: false, message: "Country discounts saved" }
}

export async function updateProductCustomization(
  id: string,
  unsafeData: z.infer<typeof productCustomizationSchema>
) {
  const { userId } = await auth()
  const { success, data } = productCustomizationSchema.safeParse(unsafeData)
  const canCustomize = await canCustomizeBanner(userId)

  if (!success || !userId || !canCustomize) {
    return {
      error: true,
      message: "There was an error updating your banner",
    }
  }

  await updateProductCustomizationDb(data, { productId: id, userId })

  return { error: false, message: "Banner updated" }
}
