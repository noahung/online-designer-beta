# 🔍 WordPress Plugin Debug Guide

## Step-by-Step Debugging Process

### Step 1: Check WordPress Error Logs
1. Enable WordPress debugging by adding this to your `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

2. Try activating the plugin again
3. Check the debug log at: `wp-content/debug.log`
4. Look for the specific error message

### Step 2: Test with Minimal Versions

I've created several test versions in your plugin folder:

#### A. Test WordPress Environment
Visit: `yoursite.com/wp-content/plugins/online-designer-forms/wp-test.php`

#### B. Test Minimal Plugin
1. Rename `test-minimal.php` to `online-designer-forms.php`
2. Try activating it
3. If it works, the issue is in the complex code

#### C. Test Debug Version
1. Rename `debug-plugin.php` to `online-designer-forms.php`
2. Check your error logs for detailed debug messages

### Step 3: Check File Permissions
Run this command on your server:
```bash
find /path/to/wp-content/plugins/online-designer-forms/ -type f -exec ls -la {} \;
```

All files should be 644, directories should be 755.

### Step 4: Check PHP Error Logs
Check your server's PHP error log (usually at `/var/log/php/error.log` or similar).

### Step 5: Common Issues & Solutions

#### Issue: "Cannot redeclare class"
**Solution**: Check if another plugin is using the same class names (ODF_API, ODF_Shortcode, ODF_Admin)

#### Issue: "Call to undefined function"
**Solution**: Missing WordPress function - check if WordPress is loading correctly

#### Issue: "Syntax error"
**Solution**: PHP syntax error in one of the plugin files

#### Issue: "Memory exhausted"
**Solution**: Increase PHP memory limit in `php.ini` or `wp-config.php`

#### Issue: "Maximum execution time"
**Solution**: Increase PHP max_execution_time

### Step 6: Manual File Check

Check these files exist and are readable:
- ✅ `online-designer-forms.php`
- ✅ `includes/class-odf-api.php`
- ✅ `includes/class-odf-shortcode.php`
- ✅ `includes/class-odf-admin.php`
- ✅ `assets/css/frontend.css`
- ✅ `assets/js/frontend.js`

### Step 7: Server Requirements Check

Your server must have:
- PHP 7.2+
- WordPress 5.0+
- MySQL 5.6+
- 128MB+ memory
- allow_url_fopen enabled

### Step 8: Plugin Conflict Test

1. Deactivate all other plugins
2. Try activating our plugin
3. If it works, reactivate plugins one by one to find conflicts

### Step 9: Fresh Upload Test

1. Delete the entire plugin folder
2. Re-upload all files
3. Try activation again

## Debug Files Created

I've created these debug files in your plugin folder:

1. **`wp-test.php`** - Tests WordPress environment
2. **`test-minimal.php`** - Minimal plugin version
3. **`debug-plugin.php`** - Debug version with logging
4. **`test-plugin.php`** - Comprehensive plugin test

## Quick Diagnosis

Run this in your browser:
```
yoursite.com/wp-content/plugins/online-designer-forms/wp-test.php
```

If this shows all ✅, then WordPress is working correctly.

## Most Likely Causes

Based on the error, the most likely causes are:

1. **PHP Syntax Error** - Extra characters or malformed PHP
2. **Missing File** - One of the required files is missing
3. **File Permissions** - Files not readable by PHP
4. **Memory Limit** - PHP running out of memory
5. **Plugin Conflict** - Another plugin interfering

## Emergency Fix

If nothing works, try this minimal version:

```php
<?php
/**
 * Plugin Name: Minimal ODF
 * Description: Minimal test
 * Version: 1.0.0
 */

add_shortcode('test', function() {
    return '<p>Test shortcode works!</p>';
});
```

If this activates, the issue is in the complex code.
