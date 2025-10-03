import { Download } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { FormResponse, exportResponsesToCSV } from '../../api/responses'

interface ExportButtonProps {
  responses: FormResponse[]
  formName: string
  disabled?: boolean
}

export default function ExportButton({ responses, formName, disabled = false }: ExportButtonProps) {
  const { theme } = useTheme()

  const handleExport = () => {
    try {
      exportResponsesToCSV(responses, formName)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export responses. Please try again.')
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || responses.length === 0}
      className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
        theme === 'light'
          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
      }`}
      title={responses.length === 0 ? 'No responses to export' : 'Export responses to CSV'}
    >
      <Download className="w-4 h-4" />
      <span>Export CSV</span>
    </button>
  )
}
