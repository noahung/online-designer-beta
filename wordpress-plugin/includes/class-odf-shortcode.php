<?php
if (!defined('ABSPATH')) exit;
class ODF_Shortcode {
    public static function render_form($atts) {
        $atts = shortcode_atts(array('id' => get_option('odf_default_form_id')), $atts);
        $form_id = sanitize_text_field($atts['id']);
    $api_url = 'https://bahloynyhjgmdndqabhu.supabase.co/functions/v1/api-forms?id=' . urlencode($form_id); // Hardcoded API URL
        $api_key = get_option('odf_api_key');
        if (!$form_id || !$api_key) {
            return '<div style="color:red;">Form configuration missing. Please check plugin settings.</div>';
        }
        $response = wp_remote_get($api_url, array(
            'headers' => array('Authorization' => 'Bearer ' . $api_key)
        ));
        if (is_wp_error($response)) {
            return '<div style="color:red;">Unable to fetch form. Error: ' . esc_html($response->get_error_message()) . '</div>';
        }
        $body = wp_remote_retrieve_body($response);
        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) {
            return '<div style="color:red;">Unable to fetch form. API response: <pre>' . esc_html($body) . '</pre></div>';
        }
        // Render the designer form using an iframe for full functionality with auto-resize
        $iframe_id = 'odf_iframe_' . uniqid();
        $html = '<iframe id="' . esc_attr($iframe_id) . '" src="' . esc_url($iframe_url) . '" style="width:100%;border:none;display:block;" allowfullscreen></iframe>';
        $html .= '<script>
            (function() {
                var iframe = document.getElementById("' . esc_js($iframe_id) . '");
                function setHeight(e) {
                    if (e.data && e.data.type === "designerFormHeight" && e.data.height) {
                        iframe.style.height = e.data.height + "px";
                    }
                }
                window.addEventListener("message", setHeight, false);
            })();
        </script>';
        return $html;
    }
}
