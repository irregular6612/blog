import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../plugins/emitters/ogImage"
export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")
    const faviconDir = joinSegments(baseDir, "static/favicon")

    // Url of current page
    const socialUrl =
      fileData.slug === "404" ? url.toString() : joinSegments(url.toString(), fileData.slug!)

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`

    // JSON-LD structured data
    const jsonLd: Record<string, unknown>[] = []

    if (fileData.slug && fileData.slug !== "404" && fileData.slug !== "index") {
      const articleSchema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: fileData.frontmatter?.title ?? title,
        description,
        url: socialUrl,
        author: {
          "@type": "Person",
          name: cfg.pageTitle,
        },
      }
      if (fileData.dates?.created) {
        articleSchema.datePublished = fileData.dates.created.toISOString()
      }
      if (fileData.dates?.modified) {
        articleSchema.dateModified = fileData.dates.modified.toISOString()
      }
      jsonLd.push(articleSchema)

      // BreadcrumbList from slug path segments
      const slugParts = fileData.slug.split("/").filter(Boolean)
      if (slugParts.length > 0) {
        const breadcrumbItems = slugParts.map((part, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: idx === slugParts.length - 1 ? (fileData.frontmatter?.title ?? part) : part,
          item: `https://${cfg.baseUrl}/${slugParts.slice(0, idx + 1).join("/")}`,
        }))
        jsonLd.push({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbItems,
        })
      }
    }

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath) ?? "png"}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
          </>
        )}

        {/* Theme-aware SVG favicon (modern browsers), with PNG fallbacks */}
        <link
          rel="icon"
          type="image/svg+xml"
          href={joinSegments(faviconDir, "icon-light.svg")}
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href={joinSegments(faviconDir, "icon-dark.svg")}
          media="(prefers-color-scheme: dark)"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={joinSegments(faviconDir, "icon-32.png")}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={joinSegments(faviconDir, "icon-16.png")}
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={joinSegments(faviconDir, "apple-touch-icon.png")}
        />
        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {jsonLd.map((schema) => (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
