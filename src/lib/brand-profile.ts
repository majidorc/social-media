export interface BrandProfileContext {
  companyName: string | null;
  businessDescription: string | null;
  websiteUrl: string | null;
  socialHandle: string | null;
}

export function hasBrandProfile(context: BrandProfileContext): boolean {
  return Boolean(
    context.companyName?.trim() ||
      context.businessDescription?.trim() ||
      context.websiteUrl?.trim() ||
      context.socialHandle?.trim(),
  );
}

export function normalizeBrandProfileField(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildBrandContextSystemRule(context: BrandProfileContext): string {
  if (!hasBrandProfile(context)) {
    return "";
  }

  const companyName = context.companyName?.trim() || "the brand";
  const businessDescription =
    context.businessDescription?.trim() || "a growing business";
  const websiteUrl = context.websiteUrl?.trim();
  const socialHandle = context.socialHandle?.trim();

  const ctaTargets: string[] = [];

  if (websiteUrl) {
    ctaTargets.push(`the official website URL (${websiteUrl})`);
  }

  if (socialHandle) {
    ctaTargets.push(`their handle (${socialHandle})`);
  }

  const ctaRule = ctaTargets.length
    ? `Whenever creating calls to action (CTA), prefer explicitly using ${ctaTargets.join(" or mentioning ")} natively instead of using generic text like "link in bio".`
    : `Whenever creating calls to action (CTA), avoid generic placeholders like "link in bio" and write brand-specific CTAs instead.`;

  return `

Brand Context:
- You are the expert social media copywriter for the company "${companyName}", which is described as: ${businessDescription}.
- ${ctaRule}`;
}
