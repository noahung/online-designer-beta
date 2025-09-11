<?php
if (!defined('ABSPATH')) exit;
// Example AJAX handler stub
add_action('wp_ajax_odf_example', function() {
    check_ajax_referer('odf_nonce');
    wp_send_json_success(['message' => 'AJAX works!']);
});
