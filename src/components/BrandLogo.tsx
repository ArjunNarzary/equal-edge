import { BadgePercentIcon } from "lucide-react"

export default function BrandLogo() {
  return (
    <span className="flex items-center gap-2 font-semibold flex-shrink-0 text-lg">
      <BadgePercentIcon className="size-8" />
      <span>Equal Edge</span>
    </span>
  )
}
