# Drag and Drop Image Upload Feature

## Overview

Image selection steps in the Form Builder now support **drag and drop** functionality for uploading images to option cards. This makes it faster and more intuitive to add images to your form steps.

## Features

### 1. Drag and Drop to Upload
- Drag image files from your computer directly onto image option cards
- Works for both empty cards (to add images) and existing images (to replace them)
- Visual feedback shows when you're dragging over a drop zone
- **Auto-naming**: Option labels are automatically populated from file names (e.g., "casement-window.jpg" → "Casement Window")

### 2. Visual Indicators
- **Empty Cards**: 
  - Shows "Upload or drag image" text
  - Highlights blue when dragging over with "Drop image here" message
  - Upload icon changes color to indicate drop zone

- **Cards with Images**:
  - Blue overlay appears when dragging over
  - Shows "Drop to replace image" message
  - Image dims slightly to indicate it will be replaced

### 3. Click to Upload (Original Method)
- Still works as before
- Click on any image card to open file picker
- Supports both empty and existing image cards
- Also benefits from auto-naming feature

## How to Use

### Upload to Empty Card
1. **Method 1: Drag and Drop**
   - Find an image file on your computer
   - Drag it over the empty image card in the Form Builder
   - Card will highlight blue when you hover over it
   - Drop the file
   - Image will appear immediately

2. **Method 2: Click to Upload** (Original)
   - Click the "Upload or drag image" area
   - Select an image from the file picker
   - Image will appear immediately

### Replace Existing Image
1. **Method 1: Drag and Drop**
   - Drag a new image file over an existing image card
   - Card will show blue overlay with "Drop to replace image"
   - Drop the file
   - Image will be replaced immediately

2. **Method 2: Click to Replace** (Original)
   - Hover over the existing image
   - Click the blue camera icon that appears
   - Select a new image from the file picker
   - Image will be replaced immediately

## Technical Details

### Supported File Types
- All standard image formats (PNG, JPG, JPEG, GIF, WebP, SVG, etc.)
- Browser automatically filters for image files during drag and drop
- Non-image files are ignored if dropped

### Drag and Drop Events Handled
- `onDragOver`: Prevents default behavior and shows visual feedback
- `onDragLeave`: Removes visual feedback when drag leaves the area
- `onDrop`: Handles the dropped file and uploads it

### Visual States
1. **Normal State**: Default appearance with "Upload or drag image" text
2. **Hover State**: Cyan highlight on hover (click method)
3. **Dragging Over State**: Blue highlight with larger text and icon
4. **Has Image State**: Shows uploaded image with overlay controls

### User Experience Enhancements

#### Visual Feedback
- Smooth transitions between states (200ms duration)
- Color changes to indicate active drop zones
- Scale animations on hover and drag
- Clear messaging ("Drop image here", "Drop to replace image")

#### Accessibility
- Maintains keyboard accessibility via click method
- Clear visual indicators for all states
- Consistent with existing UI design patterns

## Browser Compatibility

Works in all modern browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

### Drag and Drop API Support
The HTML5 Drag and Drop API is well-supported in all modern browsers. Users on older browsers can still use the click-to-upload method.

## Implementation Details

### React Component Structure
```typescript
// State for drag feedback
const [isDraggingOver, setIsDraggingOver] = useState(false)

// Event handlers
handleImageDragOver(e) // Shows visual feedback
handleImageDragLeave(e) // Hides visual feedback
handleImageDrop(e) // Processes dropped file
```

### File Processing
When a file is dropped:
1. Extract files from `e.dataTransfer.files`
2. Filter for image files only (checks `file.type.startsWith('image/')`)
3. Pass the file to the existing `onFileChange` handler
4. File is processed and preview is generated

### Styling States
```typescript
// Dynamic classes based on drag state
className={isDraggingOver 
  ? 'border-blue-400 bg-blue-500/20 scale-105'
  : 'border-white/30 hover:border-cyan-400/50'
}
```

## Examples

### Image Selection Step (Windows & Doors)
```
┌────────────────────────────────────────────┐
│  Which window style are you looking for?   │
├────────────────────────────────────────────┤
│                                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│  │ [Image] │ │ [Drag]  │ │ [Image] │     │
│  │         │ │  Here   │ │         │     │
│  │ Casement│ │   ↓     │ │ Sliding │     │
│  └─────────┘ └─────────┘ └─────────┘     │
│                                            │
└────────────────────────────────────────────┘
```

### Drag Over State
```
┌────────────────────────┐
│                        │
│   ╔═══════════════╗    │
│   ║   [Upload]    ║    │ ← Blue highlight
│   ║      ↓        ║    │
│   ║ Drop to add   ║    │
│   ╚═══════════════╝    │
│                        │
└────────────────────────┘
```

### Replace Image State
```
┌────────────────────────┐
│   ┌────────────────┐   │
│   │  [Existing]    │   │
│   │   Image with   │   │ ← Dimmed
│   │   Blue overlay │   │
│   │   "Drop to     │   │
│   │    replace"    │   │
│   └────────────────┘   │
└────────────────────────┘
```

## Benefits

### For Users
1. **Faster Workflow**: Drag files directly from desktop or file manager
2. **Natural Interaction**: Familiar drag and drop pattern
3. **Visual Feedback**: Always know where to drop files
4. **Flexible Options**: Choose drag-drop or click-upload based on preference

### For Developers
1. **Minimal Code**: Leverages existing file handling logic
2. **Progressive Enhancement**: Click method still works if drag fails
3. **Type Safety**: TypeScript ensures proper event handling
4. **Maintainable**: Clean separation of concerns

## Troubleshooting

### Image Not Uploading After Drop
- **Check file type**: Must be an image file (PNG, JPG, etc.)
- **Try clicking instead**: Use the click-to-upload method as fallback
- **Check browser console**: Look for any error messages

### Visual Feedback Not Showing
- **Browser compatibility**: Ensure you're using a modern browser
- **Check drag event**: Make sure you're dragging over the card, not just the border
- **Try refreshing**: Sometimes a page refresh resolves visual issues

### Image Replaced Instead of Added
- **Drop location**: Make sure you're dropping on an empty card for new images
- **Check card state**: Existing images will be replaced when you drop new files

## Future Enhancements

Potential improvements for future versions:

1. **Multiple File Upload**
   - Drag multiple images at once
   - Automatically create option cards for each image
   - Bulk upload progress indicator

2. **Image Validation**
   - Check image dimensions before upload
   - Show error if image is too small/large
   - Warn if file size exceeds limit

3. **Preview During Drag**
   - Show thumbnail of dragged image
   - Preview how it will look before dropping
   - Compare side-by-side with existing image

4. **Drag to Reorder + Upload**
   - Prevent conflicts between drag-to-reorder and drag-to-upload
   - Clear visual distinction between the two operations
   - Improved drag handles

5. **Image Cropping**
   - Crop/resize images after upload
   - Adjust positioning within card
   - Filters and effects

## Related Documentation

- [Auto-Naming Image Options](./AUTO_NAMING_IMAGE_OPTIONS.md) - Automatic label generation from file names
- [Step Templates Guide](./STEP_TEMPLATES_GUIDE.md) - Save and reuse step configurations
- [Form Builder Guide](./README.md) - General form building instructions
- Main README for project setup

---

**Feature Added**: November 6, 2025
**Status**: ✅ Live and Working
**Browser Support**: All modern browsers
**Build Status**: ✅ Passing
**Build Status**: ✅ Passing
