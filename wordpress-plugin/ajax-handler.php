<?php
/**
 * AJAX handler for form submission
 */

add_action('wp_ajax_odf_submit_form', 'odf_submit_form_handler');
add_action('wp_ajax_nopriv_odf_submit_form', 'odf_submit_form_handler');

function odf_submit_form_handler() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'], 'odf_nonce')) {
        wp_send_json_error('Security check failed');
    }

    $form_id = sanitize_text_field($_POST['form_id']);
    $form_data = json_decode(stripslashes($_POST['form_data']), true);

    if (!$form_data) {
        wp_send_json_error('Invalid form data');
    }

    // Submit to API
    $result = ODF_API::submit_form($form_id, $form_data);

    if ($result && !isset($result['error'])) {
        wp_send_json_success('Form submitted successfully');
    } else {
        $error_message = isset($result['error']) ? $result['error'] : 'Failed to submit form';
        wp_send_json_error($error_message);
    }
}
?>
