'use client'

type Props = {
  options: { id: string; text: string; votes: number }[]
  byModelFamily: Record<string, { total: number; breakdown: Record<string, number> }>
}

const MODEL_FAMILY_CONFIG = {
  claude: { label: 'Claude', color: 'bg-claude', textColor: 'text-claude' },
  gpt: { label: 'GPT', color: 'bg-gpt', textColor: 'text-gpt' },
  gemini: { label: 'Gemini', color: 'bg-gemini', textColor: 'text-gemini' },
  llama: { label: 'Llama', color: 'bg-llama', textColor: 'text-llama' },
  other: { label: 'Other', color: 'bg-other', textColor: 'text-other' }
}

export default function ModelFamilyBreakdown({ options, byModelFamily }: Props) {
  const families = Object.entries(byModelFamily)
    .filter(([_, data]) => data.total > 0)
    .sort((a, b) => b[1].total - a[1].total)

  if (families.length === 0) {
    return (
      <div className="card text-center text-muted py-8">
        No votes yet to show breakdown
      </div>
    )
  }

  return (
    <div className="card overflow-x-auto">
      <h3 className="font-semibold mb-4">Results by Model Family</h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-2">Family</th>
            {options.map((opt) => (
              <th key={opt.id} className="text-right py-2 px-2" title={opt.text}>
                {opt.text.length > 20 ? opt.text.slice(0, 20) + '...' : opt.text}
              </th>
            ))}
            <th className="text-right py-2 px-2">n</th>
          </tr>
        </thead>
        <tbody>
          {families.map(([family, data]) => {
            const config = MODEL_FAMILY_CONFIG[family as keyof typeof MODEL_FAMILY_CONFIG]
            return (
              <tr key={family} className="border-b border-border last:border-0">
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config?.color || 'bg-muted'}`} />
                    <span className={config?.textColor || 'text-muted'}>
                      {config?.label || family}
                    </span>
                  </div>
                </td>
                {options.map((opt) => {
                  const votes = data.breakdown[opt.id] || 0
                  const percentage = data.total > 0 ? Math.round((votes / data.total) * 100) : 0
                  return (
                    <td key={opt.id} className="text-right py-3 px-2">
                      <span className="font-medium">{percentage}%</span>
                      <span className="text-muted ml-1">({votes})</span>
                    </td>
                  )
                })}
                <td className="text-right py-3 px-2 text-muted">
                  {data.total.toLocaleString()}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Visual breakdown bars */}
      <div className="mt-6 space-y-4">
        {options.map((opt) => {
          const totalForOption = families.reduce(
            (sum, [_, data]) => sum + (data.breakdown[opt.id] || 0),
            0
          )
          if (totalForOption === 0) return null

          return (
            <div key={opt.id}>
              <div className="text-sm mb-1 truncate" title={opt.text}>
                {opt.text}
              </div>
              <div className="h-6 rounded-full overflow-hidden flex bg-border">
                {families.map(([family, data]) => {
                  const votes = data.breakdown[opt.id] || 0
                  const percentage = (votes / totalForOption) * 100
                  if (percentage === 0) return null

                  const config = MODEL_FAMILY_CONFIG[family as keyof typeof MODEL_FAMILY_CONFIG]
                  return (
                    <div
                      key={family}
                      className={`${config?.color || 'bg-muted'} h-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                      title={`${config?.label || family}: ${Math.round(percentage)}%`}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          {families.map(([family]) => {
            const config = MODEL_FAMILY_CONFIG[family as keyof typeof MODEL_FAMILY_CONFIG]
            return (
              <div key={family} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${config?.color || 'bg-muted'}`} />
                <span>{config?.label || family}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
