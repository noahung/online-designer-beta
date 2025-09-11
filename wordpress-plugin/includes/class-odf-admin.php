<?php
/**
 * Admin functionality for Online Designer Forms
 */

class ODF_Admin {

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }

    public function add_admin_menu() {
        add_menu_page(
            'Online Designer Forms',
            'ODF Settings',
            'manage_options',
            'online-designer-forms',
            array($this, 'admin_page'),
            'dashicons-feedback',
            30
        );
    }

    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>Online Designer Forms Settings</h1>
            <p>Use shortcodes like <code>[online_designer_form id="your-form-id"]</code> to embed forms in your posts and pages.</p>
            <p>Make sure to set the correct API base URL in the plugin file. Current URL: <strong><?php echo esc_html(ODF_API_BASE_URL); ?></strong></p>
            <h2>How to Use:</h2>
            <ol>
                <li>Get your form ID from the Online Designer app</li>
                <li>Add the shortcode to any post or page: <code>[online_designer_form id="form-id-here"]</code></li>
                <li>The form will render natively on your WordPress site</li>
            </ol>
            <p><strong>Note:</strong> Ensure your API is accessible and CORS is configured if needed.</p>
        </div>
        <?php
    }
}

// Initialize admin
new ODF_Admin();
?>
