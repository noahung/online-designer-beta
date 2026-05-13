// Single-page form field type definitions
// These drive the "Add Field" panel in SinglePageFormBuilder and the renderer in FormEmbed

export type SinglePageFieldType =
  // Contact info
  | 'sp_short_text'
  | 'sp_long_text'
  | 'sp_email'
  | 'sp_phone'
  | 'sp_address'
  | 'sp_website'
  // Choice
  | 'sp_multiple_choice'
  | 'sp_dropdown'
  | 'sp_picture_choice'
  | 'sp_yes_no'
  | 'sp_checkbox'
  | 'sp_legal'
  // Numbers & dates
  | 'sp_number'
  | 'sp_date'
  // Files
  | 'sp_file_upload'
  // Rating & ranking
  | 'sp_rating'
  | 'sp_opinion_scale'
  | 'sp_nps'
  // Layout / special
  | 'sp_statement'

export interface SinglePageFieldDefinition {
  type: SinglePageFieldType
  label: string
  description: string
  icon: string          // emoji icon for simplicity, replaced with Lucide in the builder
  category: FieldCategory
}

export type FieldCategory =
  | 'Contact Info'
  | 'Choice'
  | 'Text'
  | 'Numbers & Dates'
  | 'Files'
  | 'Rating & Ranking'
  | 'Layout'

export const SINGLE_PAGE_FIELD_DEFINITIONS: SinglePageFieldDefinition[] = [
  // ── Contact Info ──────────────────────────────────────────────────────────
  {
    type: 'sp_short_text',
    label: 'Short Text',
    description: 'Single-line text input',
    icon: '✏️',
    category: 'Text',
  },
  {
    type: 'sp_long_text',
    label: 'Long Text',
    description: 'Multi-line textarea',
    icon: '📝',
    category: 'Text',
  },
  {
    type: 'sp_email',
    label: 'Email',
    description: 'Email address field with validation',
    icon: '✉️',
    category: 'Contact Info',
  },
  {
    type: 'sp_phone',
    label: 'Phone Number',
    description: 'Phone number input',
    icon: '📞',
    category: 'Contact Info',
  },
  {
    type: 'sp_address',
    label: 'Address',
    description: 'Street, city, postcode fields',
    icon: '📍',
    category: 'Contact Info',
  },
  {
    type: 'sp_website',
    label: 'Website',
    description: 'URL input with validation',
    icon: '🌐',
    category: 'Contact Info',
  },

  // ── Choice ────────────────────────────────────────────────────────────────
  {
    type: 'sp_multiple_choice',
    label: 'Multiple Choice',
    description: 'Select one or more options',
    icon: '☑️',
    category: 'Choice',
  },
  {
    type: 'sp_dropdown',
    label: 'Dropdown',
    description: 'Select one option from a list',
    icon: '🔽',
    category: 'Choice',
  },
  {
    type: 'sp_picture_choice',
    label: 'Picture Choice',
    description: 'Choose from image cards',
    icon: '🖼️',
    category: 'Choice',
  },
  {
    type: 'sp_yes_no',
    label: 'Yes / No',
    description: 'Simple two-option toggle',
    icon: '✅',
    category: 'Choice',
  },
  {
    type: 'sp_checkbox',
    label: 'Checkbox',
    description: 'Single checkbox for agreement or consent',
    icon: '☑',
    category: 'Choice',
  },
  {
    type: 'sp_legal',
    label: 'Legal',
    description: 'Terms agreement with checkbox',
    icon: '⚖️',
    category: 'Choice',
  },

  // ── Numbers & Dates ───────────────────────────────────────────────────────
  {
    type: 'sp_number',
    label: 'Number',
    description: 'Numeric input with optional min/max',
    icon: '#️⃣',
    category: 'Numbers & Dates',
  },
  {
    type: 'sp_date',
    label: 'Date',
    description: 'Date picker',
    icon: '📅',
    category: 'Numbers & Dates',
  },

  // ── Files ─────────────────────────────────────────────────────────────────
  {
    type: 'sp_file_upload',
    label: 'File Upload',
    description: 'Allow users to upload files',
    icon: '📎',
    category: 'Files',
  },

  // ── Rating & Ranking ──────────────────────────────────────────────────────
  {
    type: 'sp_rating',
    label: 'Rating',
    description: 'Star rating (1–5)',
    icon: '⭐',
    category: 'Rating & Ranking',
  },
  {
    type: 'sp_opinion_scale',
    label: 'Opinion Scale',
    description: 'Numeric scale (e.g. 1–10)',
    icon: '📊',
    category: 'Rating & Ranking',
  },
  {
    type: 'sp_nps',
    label: 'Net Promoter Score®',
    description: 'How likely are you to recommend us? (0–10)',
    icon: '🔢',
    category: 'Rating & Ranking',
  },

  // ── Layout ────────────────────────────────────────────────────────────────
  {
    type: 'sp_statement',
    label: 'Statement',
    description: 'Display a block of text with no input',
    icon: '💬',
    category: 'Layout',
  },
]

export const FIELD_CATEGORIES: FieldCategory[] = [
  'Contact Info',
  'Text',
  'Choice',
  'Numbers & Dates',
  'Files',
  'Rating & Ranking',
  'Layout',
]

export const fieldsByCategory = FIELD_CATEGORIES.reduce((acc, cat) => {
  acc[cat] = SINGLE_PAGE_FIELD_DEFINITIONS.filter(f => f.category === cat)
  return acc
}, {} as Record<FieldCategory, SinglePageFieldDefinition[]>)

// ── Field data model ──────────────────────────────────────────────────────────

export interface SinglePageFieldOption {
  id: string
  label: string
  description?: string
  image_url?: string
  imageFile?: File | null
}

export interface SinglePageField {
  // persisted as a form_step row with question_type = the SinglePageFieldType string
  id?: string
  field_type: SinglePageFieldType
  label: string
  description?: string
  placeholder?: string
  is_required: boolean
  field_order: number
  // Choice field options
  options: SinglePageFieldOption[]
  // Multiple choice settings
  allow_multiple?: boolean
  // Rating / scale settings
  scale_min?: number
  scale_max?: number
  scale_min_label?: string
  scale_max_label?: string
  // Number settings
  number_min?: number
  number_max?: number
  // File upload settings
  max_file_size?: number
  allowed_file_types?: string[]
  // Picture choice settings
  images_per_row?: number
}

export function emptyField(
  type: SinglePageFieldType,
  order: number
): SinglePageField {
  const def = SINGLE_PAGE_FIELD_DEFINITIONS.find(d => d.type === type)!
  return {
    field_type: type,
    label: def.label,
    description: '',
    placeholder: '',
    is_required: false,
    field_order: order,
    options: needsOptions(type)
      ? [
          { id: crypto.randomUUID(), label: 'Option 1' },
          { id: crypto.randomUUID(), label: 'Option 2' },
        ]
      : [],
    scale_min: type === 'sp_nps' ? 0 : 1,
    scale_max: type === 'sp_nps' ? 10 : type === 'sp_rating' ? 5 : 10,
  }
}

export function needsOptions(type: SinglePageFieldType): boolean {
  return ['sp_multiple_choice', 'sp_dropdown', 'sp_picture_choice'].includes(type)
}
