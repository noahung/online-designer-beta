import React from "react"
import { motion } from "framer-motion"
import { AnimatedGradient } from "@/components/ui/animated-gradient-with-svg"
import { Edit, Trash2 } from "lucide-react"

interface ClientCardProps {
  client: {
    id: string
    name: string
    logo_url: string | null
    primary_color: string
    secondary_color: string
    webhook_url: string | null
    created_at: string
  }
  index: number
  onEdit: () => void
  onDelete: () => void
  theme: 'light' | 'dark'
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  index,
  onEdit,
  onDelete,
}) => {
  const colors = [client.primary_color, client.secondary_color, "#93C5FD"]

  return (
    <motion.div
      className="relative overflow-hidden h-full bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 hover:shadow-2xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      <AnimatedGradient colors={colors} speed={0.05} blur="medium" />
      
      <motion.div
        className="relative z-10 p-6 backdrop-blur-sm h-full flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
      >
        {/* Header with actions */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
              {client.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Created {new Date(client.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="p-2 rounded-xl transition-all duration-200 hover:scale-110 text-gray-500 dark:text-white/60 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/20"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-xl transition-all duration-200 hover:scale-110 text-gray-500 dark:text-white/60 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 flex-1">
          {/* Brand Colors */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wide mb-2 block text-gray-600 dark:text-gray-400">
              Brand Colors
            </label>
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl border-2 shadow-lg ring-2 transition-transform hover:scale-110 border-gray-200 dark:border-white/30 ring-gray-100 dark:ring-white/10"
                style={{ backgroundColor: client.primary_color }}
                title={`Primary: ${client.primary_color}`}
              />
              <div
                className="w-10 h-10 rounded-xl border-2 shadow-lg ring-2 transition-transform hover:scale-110 border-gray-200 dark:border-white/30 ring-gray-100 dark:ring-white/10"
                style={{ backgroundColor: client.secondary_color }}
                title={`Secondary: ${client.secondary_color}`}
              />
            </div>
          </div>

          {/* Logo */}
          {client.logo_url && (
            <div>
              <label className="text-xs font-medium uppercase tracking-wide mb-2 block text-gray-600 dark:text-gray-400">
                Logo
              </label>
              <div className="backdrop-blur-sm p-3 rounded-xl border bg-gray-50 dark:bg-white/10 border-gray-100 dark:border-white/20">
                <img
                  src={client.logo_url}
                  alt={`${client.name} logo`}
                  className="h-8"
                />
              </div>
            </div>
          )}

          {/* Webhook Status */}
          {client.webhook_url && (
            <div>
              <label className="text-xs font-medium uppercase tracking-wide mb-2 block text-gray-600 dark:text-gray-400">
                Webhook
              </label>
              <div className="backdrop-blur-sm p-3 rounded-xl border bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-400/30">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2 bg-green-500 dark:bg-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    Zapier Connected
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export { ClientCard }
