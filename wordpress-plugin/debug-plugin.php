<?php
/**
 * Plugin Name: Online Designer Forms (Debug Version)
 * Plugin URI: https://github.com/noahung/online-designer-beta
 * Description: Debug version with logging for Online Designer Forms.
 * Version: 1.0.0
 * Author: Noah Ung
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: online-designer-forms
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Enable error logging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', WP_CONTENT_DIR . '/debug-odf.log');

// Define plugin constants
define('ODF_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ODF_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ODF_API_BASE_URL', 'https://online-designer-beta.vercel.app/api');

// Include required files
require_once ODF_PLUGIN_DIR . 'includes/class-odf-api.php';
require_once ODF_PLUGIN_DIR . 'includes/class-odf-shortcode.php';
require_once ODF_PLUGIN_DIR . 'includes/class-odf-admin.php';
require_once ODF_PLUGIN_DIR . 'ajax-handler.php';

// Initialize the plugin
class Online_Designer_Forms_Plugin {

    public function __construct() {
        error_log('ODF Debug: Plugin constructor called');
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    }

    public function init() {
        error_log('ODF Debug: Init hook called');
        // Register shortcode
        add_shortcode('online_designer_form', array('ODF_Shortcode', 'render_form'));
    }

    public function enqueue_scripts() {
        error_log('ODF Debug: Enqueue scripts called');
        wp_enqueue_style('odf-frontend-css', ODF_PLUGIN_URL . 'assets/css/frontend.css', array(), '1.0.0');
        wp_enqueue_script('odf-frontend-js', ODF_PLUGIN_URL . 'assets/js/frontend.js', array('jquery'), '1.0.0', true);
        wp_localize_script('odf-frontend-js', 'odf_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('odf_nonce')
        ));
    }
}

// Start the plugin
error_log('ODF Debug: Starting plugin');
new Online_Designer_Forms_Plugin();
?>
