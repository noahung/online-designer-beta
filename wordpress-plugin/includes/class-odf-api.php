<?php
if (!defined('ABSPATH')) exit;
class ODF_API {
    public static function get_form($form_id) {
    $api_url = 'https://bahloynyhjgmdndqabhu.supabase.co/functions/v1/api-forms?id=' . urlencode($form_id);
        $api_key = get_option('odf_api_key');
        if (!$form_id || !$api_key) return false;
        $response = wp_remote_get($api_url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json',
            )
        ));
        if (is_wp_error($response)) return false;
        return wp_remote_retrieve_body($response);
    }
}
