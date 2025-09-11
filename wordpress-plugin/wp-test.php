<?php
/**
 * Test WordPress Environment
 */

echo '<h1>WordPress Environment Test</h1>';

echo '<ul>';
echo '<li>WordPress Version: ' . get_bloginfo('version') . ' ✅</li>';
echo '<li>PHP Version: ' . phpversion() . ' ✅</li>';
echo '<li>Plugin Directory Writable: ' . (is_writable(WP_PLUGIN_DIR) ? 'Yes ✅' : 'No ❌') . '</li>';
echo '<li>Uploads Directory Writable: ' . (is_writable(wp_upload_dir()['basedir']) ? 'Yes ✅' : 'No ❌') . '</li>';
echo '<li>cURL Enabled: ' . (function_exists('curl_init') ? 'Yes ✅' : 'No ❌') . '</li>';
echo '<li>allow_url_fopen: ' . (ini_get('allow_url_fopen') ? 'Yes ✅' : 'No ❌') . '</li>';
echo '</ul>';

echo '<p>If all items show ✅, your WordPress environment is ready for the Online Designer Forms plugin.</p>';
?>
