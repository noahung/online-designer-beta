<?php
/**
 * Admin functionality for Online Designer Forms
 */

class ODF_Admin {

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
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

    public function register_settings() {
        register_setting('odf_settings', 'odf_api_key');
    }

    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>Online Designer Forms Settings</h1>

            <form method="post" action="options.php">
                <?php settings_fields('odf_settings'); ?>
                <?php do_settings_sections('odf_settings'); ?>

                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">API Key</th>
                        <td>
                            <input type="text"
                                   name="odf_api_key"
                                   value="<?php echo esc_attr(get_option('odf_api_key')); ?>"
                                   class="regular-text"
                                   placeholder="Enter your Online Designer API key" />
                            <p class="description">
                                Get your API key from the Online Designer app settings. This is required for the plugin to work.
                            </p>
                        </td>
                    </tr>
                </table>

                <?php submit_button(); ?>
            </form>

            <h2>Usage Instructions</h2>
            <p>Use shortcodes like <code>[online_designer_form id="your-form-id"]</code> to embed forms in your posts and pages.</p>
            <p>Make sure to set the correct API base URL in the plugin file. Current URL: <strong><?php echo esc_html(ODF_API_BASE_URL); ?></strong></p>

            <h2>Testing</h2>
            <p>After saving your API key, test the connection by adding a shortcode to a test page.</p>
        </div>
        <?php
    }
}

// Initialize admin
new ODF_Admin();
?>
