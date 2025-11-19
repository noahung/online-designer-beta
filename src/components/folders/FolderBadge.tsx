import { Folder } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface FolderBadgeProps {
  folderName: string
  folderColor: string
  size?: 'sm' | 'md' | 'lg'
}

export default function FolderBadge({ folderName, folderColor, size = 'md' }: FolderBadgeProps) {
  const { theme } = useTheme()

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <div
      className={`inline-flex items-center space-x-1.5 rounded-full font-medium backdrop-blur-sm border ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${folderColor}20`,
        borderColor: `${folderColor}40`,
        color: theme === 'light' ? folderColor : `${folderColor}dd`
      }}
    >
      <Folder className={iconSizes[size]} style={{ color: folderColor }} />
      <span>{folderName}</span>
    </div>
  )
}
