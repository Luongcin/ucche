import React from 'react';
import { ExternalLink, Flame } from 'lucide-react';
import { AdminMonetizationConfig } from '../types/game';

interface MarketingAdBannerProps {
  config: AdminMonetizationConfig;
}

export const MarketingAdBanner: React.FC<MarketingAdBannerProps> = ({ config }) => {
  if (!config.showMarketingBanner) return null;

  // Check if admin has created any active custom banner ads
  const activeBannerAd = (config.customAds || []).find((ad) => ad.active && ad.type === 'banner');

  const bannerText = activeBannerAd
    ? `${activeBannerAd.title} - ${activeBannerAd.description}`
    : config.sponsorBannerText;
  const bannerLink = activeBannerAd ? activeBannerAd.targetUrl : config.sponsorBannerLink;
  const ctaLabel = activeBannerAd ? activeBannerAd.ctaText : config.sponsorCtaLabel || 'Xem Ngay';

  return (
    <div className="w-full bg-slate-900/90 border-b border-slate-800 text-xs px-3 py-1.5 flex items-center justify-between gap-3 text-slate-300 z-30">
      <div className="flex items-center gap-2 truncate">
        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
        <span className="truncate text-[11px] font-medium text-slate-200">
          {bannerText}
        </span>
      </div>

      <a
        href={bannerLink}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-2.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-md font-semibold text-[11px] transition-colors flex items-center gap-1"
      >
        <span>{ctaLabel}</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};
