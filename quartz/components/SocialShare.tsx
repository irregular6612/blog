import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import socialShareStyle from "./styles/socialshare.scss"
// @ts-ignore
import socialShareScript from "./scripts/socialshare.inline"

const SocialShare: QuartzComponent = (_props: QuartzComponentProps) => {
  return (
    <div class="social-share">
      <span class="social-share-label">공유하기</span>
      <div class="social-share-buttons">
        <button class="social-share-btn" data-share="twitter" aria-label="Twitter/X에 공유">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            />
          </svg>
        </button>
        <button class="social-share-btn" data-share="linkedin" aria-label="LinkedIn에 공유">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
            />
          </svg>
        </button>
        <button class="social-share-btn" data-share="copy" aria-label="링크 복사">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

SocialShare.css = socialShareStyle
SocialShare.afterDOMLoaded = socialShareScript

export default (() => SocialShare) satisfies QuartzComponentConstructor
