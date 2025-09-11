# Online Designer Forms WordPress Plugin

A WordPress plugin that allows you to embed Online Designer forms natively on your WordPress website using shortcodes.

## Features

- **Native WordPress Integration**: Embed forms directly in your WordPress pages and posts
- **Shortcode Support**: Use simple shortcodes to embed forms anywhere
- **Responsive Design**: Forms automatically adapt to mobile and desktop
- **Drag & Drop Uploads**: Support for file uploads with drag and drop functionality
- **Multi-step Forms**: Full support for complex multi-step forms
- **Real-time Validation**: Client-side form validation
- **AJAX Submissions**: Forms submit without page refresh
- **Customizable Styling**: Easy to customize with CSS

## Installation

1. Download the plugin files
2. Upload the `online-designer-forms` folder to your `/wp-content/plugins/` directory
3. Activate the plugin through the WordPress admin dashboard
4. **Important**: Go to **Settings > ODF Settings** and enter your API key
5. Configure your Supabase settings in **Settings > OD Forms**

### API Key Setup

You need to get your API key from the Online Designer app:

1. Log into your Online Designer account
2. Go to Settings or Account settings
3. Find your API key (it should start with `dk_live_`)
4. Copy and paste it into the WordPress plugin settings

### System Requirements

- **WordPress**: 5.0 or higher
- **PHP**: 7.2 or higher
- **MySQL**: 5.6 or higher
- **Memory**: 128MB minimum
- **Storage**: 10MB free space

### Troubleshooting

If you encounter activation errors:

1. Check the [troubleshooting guide](TROUBLESHOOTING.md)
2. Run the plugin test: Visit `yoursite.com/wp-content/plugins/online-designer-forms/test-plugin.php`
3. Use the debug shortcode: `[odf_debug]` (admin only)

### File Structure

```
online-designer-forms/
├── online-designer-forms.php      # Main plugin file
├── includes/
│   ├── class-odf-api.php         # Supabase API integration
│   ├── class-odf-shortcode.php   # Shortcode handler
│   └── class-odf-admin.php       # Admin settings
├── assets/
│   ├── css/
│   │   ├── frontend.css          # Main form styles
│   └── js/
│       └── frontend.js           # AJAX handling
├── ajax-handler.php              # Form submission handler
├── README.md                     # This file
└── Debug files (wp-test.php, test-minimal.php, etc.)
```

## Usage

### Basic Usage
Add this shortcode to any post or page:
```
[online_designer_form id="your-form-id"]
```

Replace `your-form-id` with the actual ID of your form from the Online Designer app.

### Advanced Usage
You can have multiple forms on the same page:
```
[online_designer_form id="contact-form"]
[online_designer_form id="newsletter-signup"]
```

## Configuration

### API URL Setup

Update the `ODF_API_BASE_URL` in `online-designer-forms.php` to point to your Supabase Edge Function:

```php
define('ODF_API_BASE_URL', 'https://your-project-id.supabase.co/functions/v1/api-forms');
```

Replace `your-project-id` with your actual Supabase project ID.

### Styling
Customize the form appearance by editing `assets/css/frontend.css`.

## API Endpoints

The plugin uses your existing Supabase Edge Function:
- `GET /functions/v1/api-forms/{id}?api_key=YOUR_KEY` - Fetch form data
- `POST /functions/v1/api-forms/{id}?api_key=YOUR_KEY` - Submit form responses

## Support

For support, check the main project repository or create an issue.

## License

GPL v2 or later
