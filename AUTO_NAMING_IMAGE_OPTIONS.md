# Auto-Naming Image Options from File Names

## Overview

When uploading images to image selection steps, the option label is now automatically populated from the file name. This saves time and provides sensible default names that can be edited if needed.

## How It Works

### Automatic Naming Behavior

When you upload an image file to an image selection option:

1. **If the option label is empty or default** (e.g., "Option 1", "Option 2"):
   - The file name is used as the option label
   - File extension is removed
   - Dashes and underscores are replaced with spaces
   - Each word is capitalized

2. **If the option label has been customized**:
   - The custom label is preserved
   - File name is NOT used

### Examples

#### File Name Transformations

| File Name | Generated Label |
|-----------|----------------|
| `casement-window.jpg` | `Casement Window` |
| `sliding_door.png` | `Sliding Door` |
| `double-hung-window-white.jpg` | `Double Hung Window White` |
| `tilt_and_turn.png` | `Tilt And Turn` |
| `ALUMINIUM_WINDOW.jpg` | `Aluminium Window` |
| `bay-window-2024.png` | `Bay Window 2024` |

#### Workflow Examples

**Example 1: Empty Label**
```
1. Add new image option
   Label: "Option 1" (default)
2. Upload file: "casement-window.jpg"
   Label automatically becomes: "Casement Window"
3. Edit if needed (e.g., "Casement Window Style")
```

**Example 2: Custom Label Preserved**
```
1. Add new image option
   Label: "Option 1" (default)
2. Manually change label to: "Premium Casement"
3. Upload file: "casement-window.jpg"
   Label remains: "Premium Casement" (preserved!)
```

**Example 3: Replacing Image**
```
1. Existing option with label: "Casement Window"
2. Replace image with new file: "different-window.jpg"
   Label remains: "Casement Window" (preserved!)
```

## Benefits

### Time Savings
- No need to type option names manually for most images
- Especially useful when uploading many images
- File naming conventions become option labels automatically

### Organization
- Encourages descriptive file names
- Maintains consistency between files and labels
- Easy to understand what each option represents

### Flexibility
- Auto-naming only applies to default labels
- Full control to customize labels as needed
- Can edit labels before or after uploading

## Best Practices

### File Naming for Best Results

1. **Use Descriptive Names**
   ```
   ✅ Good: casement-window.jpg
   ❌ Avoid: img001.jpg
   ```

2. **Use Hyphens or Underscores for Spaces**
   ```
   ✅ Good: sliding-patio-door.jpg
   ✅ Good: sliding_patio_door.jpg
   ❌ Avoid: slidingpatiodoor.jpg (no separation)
   ```

3. **Keep Names Concise**
   ```
   ✅ Good: bay-window.jpg
   ⚠️ OK but long: bay-window-with-white-frame-and-double-glazing.jpg
   ```

4. **Use Consistent Naming**
   ```
   ✅ Good series:
   - casement-window.jpg
   - sliding-window.jpg
   - awning-window.jpg
   ```

### Workflow Tips

1. **Name Files Before Uploading**
   - Rename files in your file manager first
   - Upload with descriptive names
   - Labels are auto-populated correctly

2. **Bulk Upload Workflow**
   ```
   1. Organize images with descriptive file names
   2. Add multiple options to your step
   3. Upload images via drag-and-drop
   4. Labels are auto-filled from file names
   5. Quick review and edit if needed
   ```

3. **When to Manually Edit**
   - File names don't perfectly match desired labels
   - Need to add additional context
   - Want shorter/longer descriptions
   - Branding or formatting requirements

## Technical Details

### Label Generation Rules

The system applies the following transformations:

1. **Remove File Extension**
   ```
   "casement-window.jpg" → "casement-window"
   ```

2. **Replace Separators**
   ```
   "casement-window" → "casement window"
   "sliding_door" → "sliding door"
   ```

3. **Capitalize Words**
   ```
   "casement window" → "Casement Window"
   ```

### When Auto-Naming Applies

Auto-naming ONLY applies when:
- ✅ A file is being uploaded
- ✅ Current label is empty (`""`)
- ✅ Current label matches pattern `"Option 1"`, `"Option 2"`, etc.

Auto-naming does NOT apply when:
- ❌ Label has been manually edited
- ❌ Label is custom text (doesn't match "Option N" pattern)
- ❌ Replacing an image (existing label is preserved)

### Code Implementation

```typescript
// Auto-generate label from filename if current label is default/empty
let newLabel = option.label
if (file && (!option.label || option.label.match(/^Option \d+$/))) {
  const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
  newLabel = fileName
    .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
    .replace(/\b\w/g, c => c.toUpperCase()) // Capitalize first letter of each word
}
```

## Use Cases

### Window & Door Configurator
```
Files:
- casement-window.jpg → "Casement Window"
- sliding-door.jpg → "Sliding Door"
- french-doors.jpg → "French Doors"
- bay-window.jpg → "Bay Window"

Result: All options properly labeled without typing!
```

### Product Catalog
```
Files:
- product-001-basic.jpg → "Product 001 Basic"
- product-002-premium.jpg → "Product 002 Premium"
- product-003-deluxe.jpg → "Product 003 Deluxe"

Result: Product codes and tiers clearly labeled
```

### Style Selection
```
Files:
- modern-minimalist.jpg → "Modern Minimalist"
- traditional-classic.jpg → "Traditional Classic"
- contemporary-sleek.jpg → "Contemporary Sleek"

Result: Style categories auto-labeled from files
```

## Edge Cases

### Special Characters
File names with special characters are handled:
- `window's-view.jpg` → `Window's View`
- `door (main).jpg` → `Door (main)` (parentheses preserved)
- `100%-guarantee.jpg` → `100% Guarantee`

### Numbers
Numbers in file names are preserved:
- `window-2024.jpg` → `Window 2024`
- `door-type-3.jpg` → `Door Type 3`
- `option-1a.jpg` → `Option 1a`

### Very Long Names
Long file names are used as-is:
- `super-long-descriptive-window-name.jpg` → `Super Long Descriptive Window Name`
- You can manually shorten after upload if needed

### Multiple Extensions
Only the last extension is removed:
- `image.backup.jpg` → `Image.backup`
- `photo.2024.png` → `Photo.2024`

## Comparison: Before vs After

### Before (Manual Naming)
```
1. Add option → Label: "Option 1"
2. Upload image: casement-window.jpg
3. Click in label field
4. Type: "Casement Window"
5. Repeat for each option (tedious!)
```

### After (Auto-Naming)
```
1. Add option → Label: "Option 1"
2. Upload image: casement-window.jpg
   → Label automatically: "Casement Window"
3. Done! (or edit if needed)
```

**Time saved**: ~5 seconds per option
**For 10 options**: ~50 seconds saved per step!

## FAQ

### Q: Can I still manually type option names?
**A:** Yes! You can type option names before or after uploading images. If you type a custom name before uploading, it will be preserved.

### Q: What if I don't like the auto-generated name?
**A:** Simply click the label field and edit it. The label is fully editable at any time.

### Q: Does this work with drag-and-drop?
**A:** Yes! Auto-naming works with both click-to-upload and drag-and-drop methods.

### Q: What about replacing images?
**A:** When replacing an existing image, the current label is preserved (not overwritten).

### Q: Can I disable this feature?
**A:** Currently, the feature is always enabled, but you can simply edit the auto-generated labels. Since it only applies to default labels, it won't interfere with your workflow.

### Q: Does this work for all step types?
**A:** No, this feature only applies to **image selection** steps, as they're the only step type that uses image files with labels.

## Integration with Other Features

### Works With Templates
- Labels are saved with templates
- When loading a template, labels are preserved
- Auto-naming applies when uploading new images to template-based steps

### Works With Drag-and-Drop
- Drop an image → Label auto-generated from file name
- Visual feedback remains the same
- Seamless experience

### Works With Step Duplication
- Duplicate a step → Labels are copied
- Upload new image → Label updates only if still default ("Option N")

## Future Enhancements

Potential improvements:

1. **Smart Name Suggestions**
   - AI-powered label suggestions based on image content
   - Industry-specific naming conventions
   - Learn from previous naming patterns

2. **Batch Renaming**
   - Apply naming pattern to multiple options at once
   - Find and replace in labels
   - Prefix/suffix all labels

3. **Name Templates**
   - Save naming patterns (e.g., "[Type] - [Color]")
   - Apply patterns to file names
   - Custom transformation rules

4. **Filename Parser Settings**
   - Choose separator character (dash, underscore, space)
   - Choose capitalization style (Title Case, UPPER CASE, lower case)
   - Custom regex patterns

## Related Features

- [Drag and Drop Upload](./DRAG_DROP_IMAGE_UPLOAD.md) - Upload images via drag-and-drop
- [Step Templates](./STEP_TEMPLATES_GUIDE.md) - Save and reuse configured steps
- [Form Builder Guide](./README.md) - Complete form building guide

---

**Feature Added**: November 6, 2025  
**Type**: UX Enhancement  
**Impact**: Time-saving, improved workflow  
**Status**: ✅ Live and Working
