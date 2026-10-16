import React from 'react'
import {
  Plus,
  GripVertical,
  Image,
  CheckSquare,
  Type,
  Phone,
  Paperclip,
  Ruler,
  Star,
  Layers,
  Copy,
  Trash2,
  Flag,
  Play
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Option {
  id?: string
  label: string
}

interface Step {
  id?: string
  title: string
  question_type: string
  step_order: number
  options?: Option[]
}

interface StudioSidebarProps {
  steps: Step[]
  activeStepIndex: number
  onSelectStep: (index: number) => void
  onAddStep: () => void
  onDuplicateStep: (index: number) => void
  onDeleteStep: (index: number) => void
  onReorderSteps: (event: DragEndEvent) => void
  welcomeScreen?: {
    enabled?: boolean
    title?: string
  }
  onToggleWelcomeScreen?: () => void
  endingScreen?: {
    title?: string
  }
}

const getQuestionIcon = (type: string) => {
  switch (type) {
    case 'image_selection':
      return <Image className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
    case 'multiple_choice':
      return <CheckSquare className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
    case 'text_input':
      return <Type className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
    case 'contact_fields':
      return <Phone className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
    case 'file_upload':
      return <Paperclip className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
    case 'dimensions':
      return <Ruler className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
    case 'opinion_scale':
      return <Star className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
    case 'loop_section':
      return <Layers className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
    default:
      return <Type className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
  }
}

function SortableStepItem({
  step,
  index,
  isActive,
  onSelect,
  onDuplicate,
  onDelete
}: {
  step: Step
  index: number
  isActive: boolean
  onSelect: () => void
  onDuplicate: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id || `step-${index}`
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
        isActive
          ? 'bg-zinc-200/70 dark:bg-[#212121] text-zinc-950 dark:text-white font-medium'
          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#18181b] hover:text-zinc-900 dark:hover:text-zinc-200'
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-grab active:cursor-grabbing p-0.5"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Type icon & Number */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-[#18181b] flex items-center justify-center">
          {getQuestionIcon(step.question_type)}
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 w-3 text-center">
          {index + 1}
        </span>
      </div>

      {/* Title */}
      <span className="text-xs truncate flex-1 leading-tight">
        {step.title || `Question ${index + 1}`}
      </span>

      {/* Hover action buttons */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-700"
          title="Duplicate step"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
          title="Delete step"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export default function StudioSidebar({
  steps,
  activeStepIndex,
  onSelectStep,
  onAddStep,
  onDuplicateStep,
  onDeleteStep,
  onReorderSteps,
  welcomeScreen,
  endingScreen
}: StudioSidebarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  return (
    <aside className="w-64 flex-shrink-0 h-full bg-white dark:bg-[#0d0d0d] border-r border-zinc-200 dark:border-zinc-800 flex flex-col select-none font-sans">
      {/* Top Action Bar */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={onAddStep}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add new question</span>
        </button>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* Start / Welcome Step */}
        <div
          onClick={() => onSelectStep(-1)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
            activeStepIndex === -1
              ? 'bg-zinc-200/70 dark:bg-[#212121] text-zinc-950 dark:text-white font-medium'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#18181b] hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-[#18181b] flex items-center justify-center text-emerald-500">
            <Play className="w-3 h-3" />
          </div>
          <span className="text-xs truncate flex-1 leading-tight">
            {welcomeScreen?.title || 'Start Screen'}
          </span>
        </div>

        {/* Dynamic Sortable Steps */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onReorderSteps}
        >
          <SortableContext
            items={steps.map((s, i) => s.id || `step-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            {steps.map((step, index) => (
              <SortableStepItem
                key={step.id || `step-${index}`}
                step={step}
                index={index}
                isActive={activeStepIndex === index}
                onSelect={() => onSelectStep(index)}
                onDuplicate={(e) => {
                  e.stopPropagation()
                  onDuplicateStep(index)
                }}
                onDelete={(e) => {
                  e.stopPropagation()
                  onDeleteStep(index)
                }}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* End / Thank you screen */}
        <div
          onClick={() => onSelectStep(steps.length)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
            activeStepIndex === steps.length
              ? 'bg-zinc-200/70 dark:bg-[#212121] text-zinc-950 dark:text-white font-medium'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#18181b] hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-[#18181b] flex items-center justify-center text-zinc-500">
            <Flag className="w-3 h-3" />
          </div>
          <span className="text-xs truncate flex-1 leading-tight">
            {endingScreen?.title || 'Ending / Thank You'}
          </span>
        </div>
      </div>
    </aside>
  )
}
