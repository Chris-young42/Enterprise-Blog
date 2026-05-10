import type { AppearanceConfig } from '@/api/site-pages'

export const defaultAppearance: AppearanceConfig = {
  themeMode: 'system',
  themePreset: 'ocean',
  fontFamily: 'sans',
  fontScale: 'md',
  widgets: {
    hotArticles: true,
    latestArticles: true,
    tagCloud: true,
    archive: true,
  },
  animations: {
    pageLoad: true,
    contentReveal: true,
    interactive: true,
  },
  backToTop: true,
  floatingAction: true,
}

export function normalizeAppearance(input: AppearanceConfig | null | undefined): AppearanceConfig {
  if (!input) return defaultAppearance
  return {
    themeMode: input.themeMode,
    themePreset: input.themePreset,
    ...(input.wallpaperUrl !== undefined ? { wallpaperUrl: input.wallpaperUrl } : {}),
    fontFamily: input.fontFamily,
    fontScale: input.fontScale,
    widgets: {
      hotArticles: input.widgets.hotArticles,
      latestArticles: input.widgets.latestArticles,
      tagCloud: input.widgets.tagCloud,
      archive: input.widgets.archive,
    },
    animations: {
      pageLoad: input.animations.pageLoad,
      contentReveal: input.animations.contentReveal,
      interactive: input.animations.interactive,
    },
    backToTop: input.backToTop,
    floatingAction: input.floatingAction,
    ...(input.customCss !== undefined ? { customCss: input.customCss } : {}),
    ...(input.customJs !== undefined ? { customJs: input.customJs } : {}),
    ...(input.customHeadHtml !== undefined ? { customHeadHtml: input.customHeadHtml } : {}),
    ...(input.customFooterHtml !== undefined ? { customFooterHtml: input.customFooterHtml } : {}),
  }
}

export function normalizeUnknownAppearance(value: unknown): AppearanceConfig {
  if (!value || typeof value !== 'object') return defaultAppearance
  const raw = value as Partial<AppearanceConfig>
  return {
    themeMode: raw.themeMode ?? defaultAppearance.themeMode,
    themePreset: raw.themePreset ?? defaultAppearance.themePreset,
    ...(raw.wallpaperUrl !== undefined ? { wallpaperUrl: raw.wallpaperUrl } : {}),
    fontFamily: raw.fontFamily ?? defaultAppearance.fontFamily,
    fontScale: raw.fontScale ?? defaultAppearance.fontScale,
    widgets: {
      hotArticles: raw.widgets?.hotArticles ?? defaultAppearance.widgets.hotArticles,
      latestArticles: raw.widgets?.latestArticles ?? defaultAppearance.widgets.latestArticles,
      tagCloud: raw.widgets?.tagCloud ?? defaultAppearance.widgets.tagCloud,
      archive: raw.widgets?.archive ?? defaultAppearance.widgets.archive,
    },
    animations: {
      pageLoad: raw.animations?.pageLoad ?? defaultAppearance.animations.pageLoad,
      contentReveal: raw.animations?.contentReveal ?? defaultAppearance.animations.contentReveal,
      interactive: raw.animations?.interactive ?? defaultAppearance.animations.interactive,
    },
    backToTop: raw.backToTop ?? defaultAppearance.backToTop,
    floatingAction: raw.floatingAction ?? defaultAppearance.floatingAction,
    ...(raw.customCss !== undefined ? { customCss: raw.customCss } : {}),
    ...(raw.customJs !== undefined ? { customJs: raw.customJs } : {}),
    ...(raw.customHeadHtml !== undefined ? { customHeadHtml: raw.customHeadHtml } : {}),
    ...(raw.customFooterHtml !== undefined ? { customFooterHtml: raw.customFooterHtml } : {}),
  }
}