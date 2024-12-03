import BrandLogo from "@/components/BrandLogo"
import { UserButton } from "@clerk/nextjs"
import Link from "next/link"

export default function NavBar() {
  return (
    <header className="flex py-4 shadow bg-background">
      <nav className="flex items-center gap-10 container">
        <Link className="mr-auto" href="/dashboard">
          <BrandLogo />
        </Link>
        <Link className="mr-auto" href="/dashboard/products">
          Products
        </Link>
        <Link className="mr-auto" href="/dashboard/analytics">
          Analytics
        </Link>
        <Link className="mr-auto" href="/dashboard/subscription">
          Subscription
        </Link>
        <UserButton />
      </nav>
    </header>
  )
}
