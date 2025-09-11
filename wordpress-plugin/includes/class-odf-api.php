<?php
/**
 * API handler for Online Designer Forms
 */

class ODF_API {

    private static $api_base_url = ODF_API_BASE_URL;

    /**
     * Fetch form data from API
     */
    public static function get_form($form_id) {
        $api_key = get_option('odf_api_key', '');
        if (empty($api_key)) {
            error_log('ODF Error: API key not configured in WordPress settings');
            return false;
        }

        $url = self::$api_base_url . '/' . $form_id . '?api_key=' . urlencode($api_key);

        $response = wp_remote_get($url, array(
            'timeout' => 15, // Increased timeout
            'headers' => array(
                'Content-Type' => 'application/json',
                'User-Agent' => 'WordPress-ODF-Plugin/1.0'
            ),
        ));

        if (is_wp_error($response)) {
            $error_message = $response->get_error_message();
            error_log('ODF API Error: ' . $error_message);
            return array('error' => 'Connection failed: ' . $error_message);
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            $body = wp_remote_retrieve_body($response);
            $error_data = json_decode($body, true);
            $error_message = isset($error_data['error']) ? $error_data['error'] : 'HTTP ' . $response_code;
            error_log('ODF API Error: ' . $error_message . ' (HTTP ' . $response_code . ')');
            return array('error' => $error_message);
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('ODF JSON Decode Error: ' . json_last_error_msg());
            return array('error' => 'Invalid response format from API');
        }

        return $data;
    }

    /**
     * Submit form data to API
     */
    public static function submit_form($form_id, $form_data) {
        $api_key = get_option('odf_api_key', '');
        if (empty($api_key)) {
            error_log('ODF Error: API key not configured');
            return false;
        }

        $url = self::$api_base_url . '/' . $form_id . '?api_key=' . urlencode($api_key);

        $response = wp_remote_post($url, array(
            'timeout' => 10,
            'body' => json_encode($form_data),
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
        ));

        if (is_wp_error($response)) {
            error_log('ODF Submit Error: ' . $response->get_error_message());
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('ODF Submit JSON Error: ' . json_last_error_msg());
            return false;
        }

        return $data;
    }
}
?>
