import CountryDiscountsForm from "@/app/dashboard/_components/forms/CountryDiscountsForm"
import ProductCustomizationForm from "@/app/dashboard/_components/forms/ProductCustomizationForm"
import ProductDetailsForm from "@/app/dashboard/_components/forms/ProductDetailsForm"
import PageWithBackButton from "@/app/dashboard/_components/PageWithBackButton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getProduct,
  getProductCountryGroups,
  getProductCustomization,
} from "@/server/db/products"
import { canCustomizeBanner, canRemoveBranding } from "@/server/permissions"
import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: { productId: string }
  searchParams: { tab?: string }
}) {
  const { productId } = await params
  const { tab = "details" } = await searchParams
  const { userId, redirectToSignIn } = await auth()
  if (!userId) return redirectToSignIn()

  const product = await getProduct({ id: productId, userId })

  if (!product) return notFound()

  return (
    <PageWithBackButton
      backButtonHref="/dashboard/products"
      pageTitle="Edit Product"
    >
      <Tabs defaultValue={tab}>
        <TabsList className="bg-background/60">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="countries">Country</TabsTrigger>
          <TabsTrigger value="customization">Customization</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <DetailsTab product={product} />
        </TabsContent>
        <TabsContent value="countries">
          <CountryTab productId={product.id} userId={userId} />
        </TabsContent>
        <TabsContent value="customization">
          <CustomizationTab productId={product.id} userId={userId} />
        </TabsContent>
      </Tabs>
    </PageWithBackButton>
  )
}

function DetailsTab({
  product,
}: {
  product: {
    id: string
    name: string
    description: string | null
    url: string
  }
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Product Details</CardTitle>
      </CardHeader>
      <CardContent>
        <ProductDetailsForm product={product} />
      </CardContent>
    </Card>
  )
}

async function CountryTab({
  productId,
  userId,
}: {
  productId: string
  userId: string
}) {
  const countryGroups = await getProductCountryGroups({
    productId,
    userId,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Country Discounts</CardTitle>
        <CardDescription>
          Leave the discount field blank if you do not want to display deals for
          any specific parity group.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CountryDiscountsForm
          productId={productId}
          countryGroups={countryGroups}
        />
      </CardContent>
    </Card>
  )
}

async function CustomizationTab({
  productId,
  userId,
}: {
  productId: string
  userId: string
}) {
  const customization = await getProductCustomization({ productId, userId })

  if (!customization) return notFound()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Banner Customization</CardTitle>
      </CardHeader>
      <CardContent>
        <ProductCustomizationForm
          canRemoveBranding={await canRemoveBranding(userId)}
          canCustomizeBanner={await canCustomizeBanner(userId)}
          customization={customization}
        />
      </CardContent>
    </Card>
  )
}
