import AdCard from "./AdCard";
import { SAMPLE_ADS, type Ad } from "./adData";
import { bannerMaxWidth, bannerVisibility, type RailLayout } from "./railGeometry";

interface AdBannerProps {
  /** Omit for an empty "Your ad here" banner */
  ad?: Ad;
  /** Must match the page's rail layout so banners and rails never both show */
  layout?: RailLayout;
  className?: string;
}

/**
 * Full width ad strip used at the top and bottom of the page on screens
 * too narrow for the side rails.
 */
export default function AdBanner({
  ad,
  layout = "wide",
  className = "",
}: AdBannerProps) {
  return (
    <div
      aria-label="Sponsored"
      className={`mx-auto ${bannerMaxWidth(layout)} px-4 ${bannerVisibility(
        layout,
      )} ${className}`}
    >
      <AdCard format="banner" ad={ad} />
    </div>
  );
}

export { SAMPLE_ADS };
