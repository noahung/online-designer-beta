# Step Templates - Quick Reference

## Quick Start

### Save a Template
```
1. Configure your step ➜ 2. Click "Save Template" ➜ 3. Enter name ➜ 4. Done!
```

### Use a Template
```
Option A: Click "Load Template" (replaces current step)
Option B: Click "Create from Template" (new step)
```

## Button Locations

### In Step Editor (when step is selected)
```
┌─────────────────────────────────────────────────────┐
│ Step 1 - image selection    [Load] [Save Template] │
│                                                     │
│ Step Title: [                                    ]  │
│ ...                                                 │
└─────────────────────────────────────────────────────┘
```

### In Empty State (no step selected)
```
┌─────────────────────────────────────────────────────┐
│            No step selected                         │
│     Create a step to start building your form       │
│                                                     │
│  [Image Selection] [Multiple Choice] [Text Input]  │
│                                                     │
│         [📁 Create from Template]                   │
└─────────────────────────────────────────────────────┘
```

## Save Template Modal
```
┌────────────────────────────────────┐
│  Save Step as Template         [×] │
├────────────────────────────────────┤
│                                    │
│  Template Name *                   │
│  [Window Style Selection        ]  │
│                                    │
│  Description (optional)            │
│  [Choose from various window    ]  │
│  [styles with images and desc.  ]  │
│                                    │
│  ℹ️ Step Type: image selection     │
│  This template will include all    │
│  current settings and options.     │
│                                    │
│        [Cancel] [💾 Save Template] │
└────────────────────────────────────┘
```

## Load Template Modal
```
┌──────────────────────────────────────────────────────┐
│  Load Step Template                              [×] │
│  Choose a saved template to configure this step      │
├──────────────────────────────────────────────────────┤
│  [🔍 Search templates...                          ]  │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ 🖼️  Window Style Selection              [🗑️]  │ │
│  │     Choose from various window styles          │ │
│  │     [image selection] [6 options]              │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ 👤  Contact Information                 [🗑️]  │ │
│  │     Standard contact form fields               │ │
│  │     [contact_fields]                           │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│                   [Cancel] [Apply Template]          │
└──────────────────────────────────────────────────────┘
```

## Template Card Details
```
┌────────────────────────────────────┐
│ [Icon] Template Name        [Delete]│
│        Description text here       │
│        [step_type] [3 options]     │
└────────────────────────────────────┘

Icons by Step Type:
🖼️  image_selection
💬  multiple_choice
📝  text_input
👤  contact_fields
📤  file_upload
📏  dimensions
⭐  opinion_scale
🖼️  frames_plan
```

## Search & Filter

### Search works on:
- Template name
- Template description
- Step type

### Example searches:
- "window" → finds "Window Style Selection"
- "contact" → finds "Contact Information"
- "image" → finds all image_selection templates

## Common Workflows

### Workflow 1: Reuse Across Forms
```
Form A: Create & configure step → Save as template
Form B: Create new step → Load template → Customize if needed
Form C: Create new step → Load same template → Done!
```

### Workflow 2: Build Template Library
```
Week 1: Create templates for common steps
  ✓ Window styles
  ✓ Door styles
  ✓ Contact info
  ✓ Budget ranges

Ongoing: Use templates for all new forms
  → 10x faster form creation!
```

### Workflow 3: Update & Improve
```
Find better option labels? Update step → Save as new template
Remove outdated template → Users create better versions
Maintain quality over time
```

## Tips & Tricks

### ✅ DO:
- Use descriptive template names
- Add helpful descriptions
- Create templates for repetitive steps
- Review and clean up old templates
- Test templates after applying

### ❌ DON'T:
- Create templates for one-off configurations
- Use vague names like "Template 1"
- Forget to update jump logic after applying
- Save incomplete/test steps as templates

## Keyboard Shortcuts

While in modals:
- `Esc` - Close modal
- `Enter` - Submit form (when in input field)
- `Tab` - Navigate between fields

## Common Issues & Solutions

### Template not appearing?
- Check that you're logged in as the correct user
- Templates are user-specific (RLS)
- Try refreshing the template list

### Jump logic not working?
- Jump-to-step settings reference step numbers
- Verify step numbers after applying template
- Adjust jump logic if form structure differs

### Images not showing?
- Templates reference existing image URLs
- If original image deleted, URL breaks
- Re-upload images after applying template

### Can't delete template?
- Ensure you own the template
- Check database connection
- Verify RLS policies are correct

## Example Templates

### 1. Window Style Selection
```yaml
Type: image_selection
Options:
  - Casement Windows (with image)
  - Sliding Windows (with image)
  - Double-Hung Windows (with image)
  - Awning Windows (with image)
Settings:
  - 4 images per row
  - Square crop enabled
  - Required: Yes
```

### 2. Contact Information
```yaml
Type: contact_fields
Fields:
  - Full Name (required)
  - Email (required)
  - Phone (optional)
  - Postcode (required)
  - Preferred Contact Method
  - Project Details
```

### 3. Budget Range
```yaml
Type: opinion_scale
Scale: 1-10 (number)
Labels:
  - Min: "Under £5,000"
  - Max: "Over £50,000"
Required: Yes
```

### 4. Upload Plans
```yaml
Type: file_upload
Settings:
  - Max size: 10 MB
  - Types: PDF, PNG, JPG
  - Required: No
```

## Database Tables

### step_templates
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Unique identifier |
| user_id | uuid | Owner reference |
| name | text | Template name |
| description | text | Optional description |
| question_type | text | Step type |
| title | text | Default step title |
| is_required | boolean | Required flag |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### step_template_options
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Unique identifier |
| template_id | uuid | Parent template |
| label | text | Option label |
| description | text | Option description |
| image_url | text | Image reference |
| jump_to_step | integer | Jump logic |
| option_order | integer | Display order |

---

**Need more help?** See [STEP_TEMPLATES_GUIDE.md](./STEP_TEMPLATES_GUIDE.md) for detailed documentation.
