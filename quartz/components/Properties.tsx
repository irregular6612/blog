import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

interface PropertiesOptions {
  hideWhenEmpty: boolean
  excludeKeys: string[]
}

const defaultOptions: PropertiesOptions = {
  hideWhenEmpty: false,
  excludeKeys: ["title", "draft", "tags"],
}

export default ((opts?: Partial<PropertiesOptions>) => {
  const options: PropertiesOptions = { ...defaultOptions, ...opts }

  const Properties: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const frontmatter = fileData.frontmatter || {}
    
    // Filter out excluded keys and empty values
    const properties = Object.entries(frontmatter)
      .filter(([key]) => !options.excludeKeys.includes(key))
      .filter(([_, value]) => value !== undefined && value !== null && value !== "")
      .sort(([a], [b]) => a.localeCompare(b))

    if (options.hideWhenEmpty && properties.length === 0) {
      return null
    }

    // Format property value for display
    const formatValue = (value: any): string => {
      if (Array.isArray(value)) {
        return value.join(", ")
      } else if (value instanceof Date) {
        return value.toISOString().split("T")[0]
      } else if (typeof value === "object" && value !== null) {
        return JSON.stringify(value)
      }
      return String(value)
    }

    // Format property key for display
    const formatKey = (key: string): string => {
      return key
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }

    return (
      <div class={classNames(displayClass, "properties")}>
        <h3>Properties</h3>
        <div class="properties-container">
          {properties.length > 0 ? (
            <dl class="properties-list">
              {properties.map(([key, value]) => (
                <>
                  <dt class="property-key">{formatKey(key)}</dt>
                  <dd class="property-value">{formatValue(value)}</dd>
                </>
              ))}
            </dl>
          ) : (
            <p class="no-properties">No properties</p>
          )}
        </div>
      </div>
    )
  }

  Properties.css = `
.properties {
  margin: 2rem 0;
  overflow-x: hidden;
  max-width: 100%;
  box-sizing: border-box;
}

.properties > h3 {
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
  font-weight: 700;
  color: var(--dark);
}

.properties-container {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.properties-list {
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem 1rem;
  font-size: 0.85rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.property-key {
  font-weight: 600;
  color: var(--gray);
  margin: 0;
  padding: 0.4rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.property-value {
  margin: 0;
  padding: 0.4rem 0;
  color: var(--darkgray);
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  max-width: 100%;
  overflow: hidden;
}

.property-value:hover {
  overflow: visible;
  position: relative;
  z-index: 10;
  background: var(--light);
}

.no-properties {
  font-size: 0.85rem;
  color: var(--gray);
  font-style: italic;
  margin: 0;
}

@media all and (max-width: 1200px) {
  .properties {
    display: none;
  }
}
`

  return Properties
}) satisfies QuartzComponentConstructor

