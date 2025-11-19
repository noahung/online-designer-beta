<?php
if (!defined('ABSPATH')) exit;

class ODF_Admin {
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'settings_init'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_styles'));
    }

    public function add_admin_menu() {
        add_menu_page(
            'Online Designer Forms',
            'Online Designer Forms',
            'manage_options',
            'online-designer-forms',
            array($this, 'settings_page'),
            'dashicons-feedback',
            80
        );
    }

    public function settings_init() {
        register_setting('odf_settings', 'odf_api_key');
        register_setting('odf_settings', 'odf_default_form_id');
    }

    public function enqueue_admin_styles($hook) {
        if ($hook !== 'toplevel_page_online-designer-forms') return;
        wp_enqueue_style('odf-google-fonts', 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap');
        wp_add_inline_style('odf-google-fonts', $this->soft_ui_css());
    }

    private function soft_ui_css() {
        return 'body.odf-soft-ui { font-family: "Roboto", sans-serif; background: #f6f8fa; }
        .odf-card { background: #fff; border-radius: 20px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 32px; max-width: 500px; margin: 40px auto; }
        .odf-card h2 { font-weight: 500; margin-bottom: 24px; color: #333; }
        .odf-field { margin-bottom: 20px; }
        .odf-label { display: block; font-weight: 500; margin-bottom: 8px; color: #555; }
        .odf-input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #e0e3e7; background: #f7f9fc; font-size: 16px; transition: box-shadow 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
        .odf-input:focus { outline: none; box-shadow: 0 0 0 2px #a3c9f7; border-color: #a3c9f7; }
        .odf-btn { background: linear-gradient(90deg, #ff9800 0%, #ff5722 100%); color: #fff; border: none; border-radius: 12px; padding: 12px 32px; font-size: 16px; font-weight: 500; cursor: pointer; box-shadow: 0 2px 8px rgba(255,152,0,0.08); transition: background 0.2s; }
        .odf-btn:hover { background: linear-gradient(90deg, #ff5722 0%, #ff9800 100%); }';
    }

    public function settings_page() {
        echo '<div class="odf-card">';
        echo '<h2>Online Designer Forms Settings</h2>';
        echo '<p style="color:#666;margin-bottom:24px;font-size:15px;">Configure your API Key and default form. The API URL is now fixed for internal use.</p>';
        echo '<form method="post" action="options.php">';
        settings_fields('odf_settings');
        do_settings_sections('odf_settings');
        echo '<div class="odf-field"><label class="odf-label" for="odf_api_key">API Key</label>';
        echo '<input class="odf-input" type="text" id="odf_api_key" name="odf_api_key" value="' . esc_attr(get_option('odf_api_key')) . '" placeholder="Enter your API key" /></div>';
        echo '<div class="odf-field"><label class="odf-label" for="odf_default_form_id">Default Form ID</label>';
        echo '<input class="odf-input" type="text" id="odf_default_form_id" name="odf_default_form_id" value="' . esc_attr(get_option('odf_default_form_id')) . '" placeholder="e.g. 123" /></div>';
        echo '<button class="odf-btn" type="submit">Save Settings</button>';
        echo '</form>';
        echo '<hr style="margin:32px 0;border:none;border-top:1px solid #eee;">';
        echo '<div style="margin-top:24px;">';
        echo '<h3 style="font-weight:500;color:#2193b0;margin-bottom:12px;">How to Use</h3>';
        echo '<p style="color:#555;font-size:15px;margin-bottom:12px;">Embed any form in your posts or pages using the shortcode:</p>';
        echo '<pre style="background:#f7f9fc;padding:12px 16px;border-radius:8px;font-size:15px;">[online_designer_form id="YOUR_FORM_ID"]</pre>';
        echo '<p style="color:#555;font-size:15px;">Replace <b>YOUR_FORM_ID</b> with the ID of the form you want to display. You can create multiple forms and use multiple shortcodes as needed.</p>';
        echo '<p style="color:#888;font-size:13px;margin-top:16px;">The default form ID will be used if no <code>id</code> is specified in the shortcode.</p>';
        echo '</div>';
        echo '<script>document.body.classList.add("odf-soft-ui");</script>';
        echo '</div>';
    }
}

// Initialize admin UI
new ODF_Admin();
