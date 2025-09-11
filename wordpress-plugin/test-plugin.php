<?php
/**
 * Comprehensive Plugin Test
 */

echo '<h1>Online Designer Forms - Comprehensive Test</h1>';

echo '<h2>WordPress Environment</h2>';
echo '<ul>';
echo '<li>WordPress Version: ' . get_bloginfo('version') . '</li>';
echo '<li>PHP Version: ' . phpversion() . '</li>';
echo '<li>Plugin Active: ' . (is_plugin_active('online-designer-forms/online-designer-forms.php') ? 'Yes' : 'No') . '</li>';
echo '</ul>';

echo '<h2>Shortcode Test</h2>';
echo '<p>Testing shortcode: [online_designer_form id="test"]</p>';
echo do_shortcode('[online_designer_form id="test"]');

echo '<h2>API Test</h2>';
if (class_exists('ODF_API')) {
    echo '<p>ODF_API class loaded ✅</p>';
    $test_form = ODF_API::get_form('test');
    if ($test_form) {
        echo '<p>API connection successful ✅</p>';
        echo '<pre>' . print_r($test_form, true) . '</pre>';
    } else {
        echo '<p>API connection failed ❌</p>';
    }
} else {
    echo '<p>ODF_API class not loaded ❌</p>';
}

echo '<h2>File Permissions</h2>';
$files_to_check = array(
    'online-designer-forms.php',
    'includes/class-odf-api.php',
    'includes/class-odf-shortcode.php',
    'includes/class-odf-admin.php',
    'assets/css/frontend.css',
    'assets/js/frontend.js'
);

foreach ($files_to_check as $file) {
    $file_path = ODF_PLUGIN_DIR . $file;
    echo '<li>' . $file . ': ' . (file_exists($file_path) ? 'Exists' : 'Missing') . ' - ' . (is_readable($file_path) ? 'Readable' : 'Not readable') . '</li>';
}
echo '</ul>';
?>
