<?php
/**
 * Custom WordPress debug configuration
 * This file is loaded by wp-config.php via auto_prepend_file or include
 */

// Only define if not already defined
if (!defined('WP_DEBUG_LOG')) {
    define('WP_DEBUG_LOG', true);
}

if (!defined('WP_DEBUG_DISPLAY')) {
    define('WP_DEBUG_DISPLAY', true);
}

if (!defined('SCRIPT_DEBUG')) {
    define('SCRIPT_DEBUG', true);
}

if (!defined('SAVEQUERIES')) {
    define('SAVEQUERIES', true);
}

// Set PHP error display
@ini_set('display_errors', '0');  // Don't display errors to prevent AJAX/header issues
@ini_set('display_startup_errors', '0');
@ini_set('log_errors', '1');  // Still log errors to file
@ini_set('error_log', '/var/www/html/wp-content/debug.log');
