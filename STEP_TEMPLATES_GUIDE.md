# Step Templates Feature

## Overview

The Step Templates feature allows you to save configured form steps as reusable templates that can be applied to any form. This significantly speeds up form creation by letting you reuse common step configurations.

## Features

### 1. Save Step as Template
- Save any configured step as a template with a custom name and description
- Templates include all step settings:
  - Step type and title
  - Required/optional setting
  - All options with labels, descriptions, and images
  - Type-specific configurations (e.g., images per row, scale settings, file upload limits)
  - Jump-to-step logic for branching

### 2. Load Templates
- Browse all your saved templates
- Search templates by name, description, or type
- Filter templates by step type (optional)
- Preview template details before applying
- Delete templates you no longer need

### 3. Apply Templates
- **Load to Existing Step**: Replace current step configuration with template
- **Create New Step**: Add a new step from template

## How to Use

### Saving a Step as Template

1. **Configure Your Step**
   - Create and configure a step in the Form Builder
   - Add all options, images, and settings you want
   - Make sure everything is set up exactly how you want it

2. **Save as Template**
   - Click the "Save Template" button at the top of the step editor
   - Enter a descriptive name (e.g., "Window Style Selection")
   - Optionally add a description explaining what this template is for
   - Click "Save Template"

3. **Confirmation**
   - You'll see a success message
   - The template is now saved and can be used in any form

### Using a Saved Template

#### Option 1: Load to Current Step
1. Select an existing step in your form
2. Click "Load Template" button
3. Browse or search for your template
4. Select the template you want
5. Click "Apply Template"
6. The current step will be replaced with the template configuration

#### Option 2: Create New Step from Template
1. In the main editor area (when no step is selected)
2. Click "Create from Template" button
3. Browse or search for your template
4. Select the template you want
5. Click "Apply Template"
6. A new step will be created with the template configuration

### Managing Templates

#### Viewing Templates
- Templates are listed in the Load Template modal
- Each template shows:
  - Template name
  - Description (if provided)
  - Step type badge
  - Number of options (if applicable)

#### Searching Templates
- Use the search bar to filter templates
- Search works on template name, description, and step type

#### Deleting Templates
- Click the trash icon next to any template
- Confirm the deletion
- The template will be permanently removed

## Database Schema

### Tables

#### `step_templates`
Stores the main template configuration:
- `id`: Unique template identifier
- `user_id`: Owner of the template
- `name`: Template name (required)
- `description`: Optional description
- `question_type`: Type of step (image_selection, multiple_choice, etc.)
- `title`: Default step title
- `is_required`: Whether step is required
- Type-specific fields (max_file_size, scale_type, etc.)
- Timestamps (created_at, updated_at)

#### `step_template_options`
Stores options for templates (for image_selection and multiple_choice types):
- `id`: Unique option identifier
- `template_id`: Reference to parent template
- `label`: Option label
- `description`: Optional option description
- `image_url`: Optional image URL
- `jump_to_step`: Optional jump logic
- `option_order`: Display order

### Security
- Row Level Security (RLS) is enabled on all tables
- Users can only view, create, edit, and delete their own templates
- Templates are automatically deleted when a user is deleted

## Use Cases

### Common Template Examples

1. **Window Style Selection**
   - Image selection step with common window types
   - Options: Casement, Sliding, Double-Hung, Awning, etc.
   - Pre-configured with appropriate images and descriptions

2. **Contact Information**
   - Contact fields step with standard fields
   - Pre-configured with name, email, phone, postcode fields

3. **Project Budget**
   - Opinion scale step for budget range
   - Pre-configured with appropriate scale and labels

4. **File Upload - Plans**
   - File upload step configured for PDF/image uploads
   - Pre-set file size limits and allowed types

5. **Dimensions Input**
   - Dimensions step pre-configured for 2D or 3D measurements
   - Standard units and labels

## Technical Implementation

### Components

#### `SaveTemplateModal.tsx`
- Modal for saving current step as template
- Form inputs for template name and description
- Displays current step type
- Handles template creation

#### `LoadTemplateModal.tsx`
- Modal for browsing and selecting templates
- Search functionality
- Template preview cards
- Delete template functionality
- Template application

### Functions in FormBuilder

#### `saveStepAsTemplate(name, description)`
- Saves current step configuration to database
- Creates template record
- Inserts template options
- Shows success/error feedback

#### `loadTemplateToStep(template)`
- Loads template data into current step
- Replaces all step configuration
- Preserves step order and ID
- Updates UI immediately

#### `createStepFromTemplate(template)`
- Creates new step from template
- Adds to end of steps list
- Selects newly created step
- Triggers history save

## Best Practices

1. **Naming Templates**
   - Use descriptive names that indicate the step's purpose
   - Include the step type if helpful (e.g., "Window Style (Image Selection)")
   - Be consistent with naming conventions

2. **Adding Descriptions**
   - Explain when to use this template
   - Note any special configurations
   - Mention any customizations needed after applying

3. **Organizing Templates**
   - Delete templates you no longer use
   - Keep templates updated with current best practices
   - Consider creating templates for each client's branding

4. **Template Maintenance**
   - Review templates periodically
   - Update templates when requirements change
   - Remove outdated templates

## Limitations

1. **Image References**
   - Template images reference existing URLs
   - If original image is deleted, template will lose the image reference
   - Consider using permanent image URLs or re-uploading images after applying template

2. **Jump Logic**
   - Jump-to-step settings are stored as step numbers
   - When applied to different forms, jump logic may need adjustment
   - Review jump logic after applying templates

3. **Client-Specific Content**
   - Templates don't include client-specific branding
   - Form-level settings (colors, theme) are not part of templates
   - Only step-level configuration is saved

## Future Enhancements

Potential improvements for future versions:

1. **Shared Templates**
   - Allow sharing templates between users
   - Public template library
   - Organization-wide templates

2. **Template Categories**
   - Organize templates into categories
   - Tag-based filtering
   - Favorites system

3. **Template Preview**
   - Visual preview of how step will look
   - Show example with sample data
   - Preview all options with images

4. **Template Export/Import**
   - Export templates as JSON
   - Import templates from files
   - Share templates between Supabase projects

5. **Version Control**
   - Save template versions
   - Track template changes
   - Rollback to previous versions

6. **Bulk Operations**
   - Apply multiple templates at once
   - Create multi-step flows from template sets
   - Template sequences/workflows

## Migration Instructions

To enable this feature in your Supabase project:

1. Run the SQL migration:
   ```bash
   # Copy the contents of supabase/add_step_templates.sql
   # Paste into Supabase SQL Editor
   # Execute the SQL
   ```

2. Verify tables were created:
   ```sql
   SELECT * FROM step_templates LIMIT 1;
   SELECT * FROM step_template_options LIMIT 1;
   ```

3. Test RLS policies:
   - Create a template through the UI
   - Verify you can see your own templates
   - Verify you cannot see other users' templates

## Support

If you encounter issues with templates:

1. Check browser console for errors
2. Verify Supabase connection
3. Ensure RLS policies are properly set
4. Check that user is authenticated
5. Verify database tables exist

For questions or feature requests, please contact the development team.
