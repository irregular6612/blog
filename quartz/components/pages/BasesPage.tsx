import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { QuartzPluginData } from "../../plugins/vfile"

interface BaseView {
  type: "table"
  name: string
  filters?: any
  order?: string[]
  columnSize?: Record<string, number>
}

interface BasesData {
  name: string
  view: BaseView
  files: QuartzPluginData[]
  columns: string[]
}

interface BasesPageProps {
  bases: BasesData
  baseUrl: string
}

function BasesRenderer({ bases, baseUrl }: BasesPageProps) {
  const { name, files, columns } = bases

  // Extract column value from file data
  const getColumnValue = (file: QuartzPluginData, column: string): any => {
    // file.name
    if (column === "file.name") {
      return file.relativePath?.split("/").pop()?.replace(/\.md$/, "") || "-"
    }

    // file.folder
    if (column === "file.folder") {
      return file.relativePath?.split("/").slice(0, -1).join("/") || "-"
    }

    // file.ext
    if (column === "file.ext") {
      const ext = file.relativePath?.split(".").pop()
      return ext || "-"
    }

    // note.* or frontmatter properties
    if (column.startsWith("note.")) {
      const prop = column.replace("note.", "")
      return file.frontmatter?.[prop] || "-"
    }

    // Direct property
    return file.frontmatter?.[column] || "-"
  }

  // Format column name for display
  const formatColumnName = (column: string): string => {
    if (column.startsWith("file.")) {
      return column.replace("file.", "").toUpperCase()
    }
    if (column.startsWith("note.")) {
      return column.replace("note.", "")
    }
    return column
  }

  // Convert file path to URL
  const getFileUrl = (file: QuartzPluginData) => {
    const slug = file.slug || ""
    // Extract only the path portion of baseUrl (e.g., "blog" from "irregular6612.github.io/blog")
    const baseUrlPath = baseUrl ? baseUrl.split('/').pop() : ''
    return baseUrlPath ? `/${baseUrlPath}/${slug}` : `/${slug}`
  }

  // Render cell value
  const renderCellValue = (file: QuartzPluginData, column: string) => {
    const value = getColumnValue(file, column)

    // If it's file.name, make it a link
    if (column === "file.name") {
      return (
        <a href={getFileUrl(file)} className="bases-file-link internal">
          {String(value)}
        </a>
      )
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return (
        <div className="bases-array">
          {value.map((item, idx) => (
            <span key={idx} className="bases-array-item">
              {String(item)}
            </span>
          ))}
        </div>
      )
    }

    // Handle objects
    if (typeof value === "object" && value !== null) {
      return <span className="bases-text">{JSON.stringify(value)}</span>
    }

    return <span className="bases-text">{String(value)}</span>
  }

  return (
    <div className="bases-container">
      <div className="bases-header">
        <h2 className="bases-title">{name}</h2>
        <div className="bases-info">
          <span className="bases-count">{files.length} 항목</span>
        </div>
      </div>

      <div className="bases-table-wrapper">
        <table className="bases-table">
          <thead>
            <tr>
              {columns.map((column, idx) => (
                <th key={idx} className="bases-th">
                  <div className="bases-th-content">
                    <span className="bases-column-name">{formatColumnName(column)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody id="bases-tbody">
            {files.map((file, idx) => (
              <tr key={idx} className="bases-row" data-row-id={idx}>
                {columns.map((column, colIdx) => {
                  const value = getColumnValue(file, column)
                  const displayValue = String(value)
                  return (
                    <td key={colIdx} className="bases-td" title={displayValue}>
                      {renderCellValue(file, column)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const BasesPage: QuartzComponent = (props: QuartzComponentProps) => {
  const { fileData, cfg } = props
  const bases = fileData.bases as BasesData | undefined

  if (!bases) {
    return <div>Database 데이터를 찾을 수 없습니다.</div>
  }

  return (
    <div className="bases-page">
      <BasesRenderer bases={bases} baseUrl={cfg?.configuration?.baseUrl || ""} />
    </div>
  )
}

BasesPage.css = `
.bases-page {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

.bases-container {
  width: 100%;
  max-width: 100%;
  background: var(--light);
  border-radius: 8px;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}

.bases-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--lightgray);
}

.bases-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--dark);
}

.bases-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.bases-count {
  padding: 4px 12px;
  background: var(--highlight);
  border-radius: 12px;
  font-size: 14px;
  color: var(--darkgray);
}


.bases-table-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  width: 100%;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
  position: relative;
  display: block;
}

.bases-table {
  width: 100%;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: auto;
  display: table;
}

.bases-th {
  background: var(--lightgray);
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--dark);
  border-bottom: 2px solid var(--gray);
  position: sticky;
  top: 0;
  z-index: 10;
  min-width: 120px;
  white-space: nowrap;
}

.bases-th-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bases-column-name {
  font-size: 14px;
  font-weight: 600;
}

.bases-td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--lightgray);
  vertical-align: top;
  min-width: 120px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
}

.bases-td:hover {
  cursor: help;
  background: var(--highlight);
}

.bases-td:hover::after {
  content: attr(title);
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: var(--light);
  border: 2px solid var(--secondary);
  padding: 12px 16px;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  white-space: normal;
  word-wrap: break-word;
  max-width: 500px;
  min-width: 250px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--darkgray);
  pointer-events: none;
  max-height: 80vh;
  overflow-y: auto;
}

.bases-row:hover {
  background: var(--highlight);
}

.bases-row:last-child .bases-td {
  border-bottom: none;
}

.bases-file-link {
  display: inline-block;
  padding: 4px 8px;
  background: var(--highlight);
  border-radius: 4px;
  text-decoration: none;
  color: var(--secondary);
  transition: all 0.2s ease;
  font-weight: 600;
}

.bases-file-link:hover {
  background: var(--secondary);
  color: var(--light);
}

.bases-text {
  color: var(--darkgray);
}

.bases-array {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bases-array-item {
  display: inline-block;
  padding: 4px 10px;
  background: var(--secondary);
  color: var(--light);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .bases-container {
    padding: 12px;
  }
  
  .bases-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .bases-title {
    font-size: 20px;
  }
  
  .bases-controls {
    flex-direction: column;
  }
  
  .bases-table {
    min-width: 500px;
    font-size: 12px;
  }
  
  .bases-th,
  .bases-td {
    padding: 8px 10px;
    font-size: 12px;
  }
  
  .bases-td {
    max-width: 200px;
  }
}
`

export default (() => BasesPage) satisfies QuartzComponentConstructor
