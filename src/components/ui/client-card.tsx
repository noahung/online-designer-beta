import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { MoreVertical, Pencil, Trash2, Building, ExternalLink } from "lucide-react"

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
  theme,
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuOpen])

  return (
    <motion.div
      className="relative overflow-visible h-full bg-[#1e1e1f] dark:bg-[#1e1e1f] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 p-5 hover:bg-[#282829] dark:hover:bg-[#282829] transition-all duration-200 shadow-sm"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="flex flex-col h-full justify-between space-y-4">
        {/* Top Section: Avatar/Logo and More Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Round Avatar Container */}
            {client.logo_url ? (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 dark:bg-white/5 border border-zinc-200/20 dark:border-zinc-800/50 flex items-center justify-center p-1.5">
                <img
                  src={client.logo_url}
                  alt={`${client.name} logo`}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-800 dark:bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-zinc-400">
                <Building className="w-5 h-5" />
              </div>
            )}

            {/* Zapier Connected Badge as outline tag */}
            {client.webhook_url && (
              <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full border border-emerald-500/30 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-transparent tracking-wide">
                Zapier Connected
              </span>
            )}
          </div>

          {/* Action Menu (Vertical Dot Dropdown) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-[#1e1e1f] border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden z-20">
                <button
                  onClick={() => {
                    onEdit()
                    setMenuOpen(false)
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors text-left"
                >
                  <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Edit Client</span>
                </button>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                <button
                  onClick={() => {
                    onDelete()
                    setMenuOpen(false)
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Client</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Middle Section: Client Name & Description */}
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-base text-white truncate">
            {client.name}
          </h3>
          <p className="text-xs text-zinc-400 font-normal leading-relaxed line-clamp-2">
            Forms responses and custom branding settings for {client.name}.
          </p>
        </div>

        {/* Bottom Section: Brand Colors, Meta, and Details */}
        <div className="pt-2 border-t border-zinc-800/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
              Colors:
            </span>
            <div className="flex items-center space-x-1.5">
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: client.primary_color }}
                title={`Primary: ${client.primary_color}`}
              />
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: client.secondary_color }}
                title={`Secondary: ${client.secondary_color}`}
              />
            </div>
          </div>
          
          <span className="text-[10px] text-zinc-500 font-medium">
            Added {new Date(client.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export { ClientCard }
