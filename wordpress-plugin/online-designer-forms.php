<?php
/**
 * Plugin Name: Online Designer Forms
 * Plugin URI: https://github.com/noahung/online-designer-beta
 * Description: Embed Online Designer forms natively in WordPress using shortcodes.
 * Version: 1.0.0
 * Author: Noah Aung
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: online-designer-forms
 */

if (!defined('ABSPATH')) exit;

define('ODF_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ODF_PLUGIN_URL', plugin_dir_url(__FILE__));
	require_once ODF_PLUGIN_DIR . 'includes/class-odf-api.php';
require_once ODF_PLUGIN_DIR . 'includes/class-odf-shortcode.php';
require_once ODF_PLUGIN_DIR . 'includes/class-odf-admin.php';
if (file_exists(ODF_PLUGIN_DIR . 'ajax-handler.php')) {
    require_once ODF_PLUGIN_DIR . 'ajax-handler.php';
}

class Online_Designer_Forms_Plugin {
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    }
    public function init() {
        add_shortcode('online_designer_form', array('ODF_Shortcode', 'render_form'));
    }
    public function enqueue_scripts() {
        wp_enqueue_style('odf-frontend-css', ODF_PLUGIN_URL . 'assets/css/frontend.css', array(), '1.0.0');
        wp_enqueue_script('odf-frontend-js', ODF_PLUGIN_URL . 'assets/js/frontend.js', array('jquery'), '1.0.0', true);
        wp_localize_script('odf-frontend-js', 'odf_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('odf_nonce')
        ));
    }
}
new Online_Designer_Forms_Plugin();
