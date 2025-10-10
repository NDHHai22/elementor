<?php
/**
 * Plugin Name: Angie
 * Description: Agentic AI for WordPress
 * Plugin URI: https://elementor.com/pages/angie-early-access
 * Version: 1.0.0
 * Author: Elementor.com
 * Author URI: https://elementor.com/
 * Text Domain: angie
 * License: GPLv3
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 * Requires at least: 6.2
 * Tested up to: 6.8
 * Requires PHP: 7.4
 *
 * @package Angie
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'ANGIE_VERSION', '1.0.0' );
define( 'ANGIE_PATH', plugin_dir_path( __FILE__ ) );
define( 'ANGIE_URL', plugins_url( '/', __FILE__ ) );
define( 'ANGIE_ASSETS_PATH', ANGIE_PATH . 'assets/' );
define( 'ANGIE_ASSETS_URL', ANGIE_URL . 'assets/' );

/**
 *  Angie Class
 */
final class Angie {

	public function __construct() {
		add_action( 'plugins_loaded', [ $this, 'init' ] );
		add_action( 'admin_init', [ $this, 'redirect_after_activation' ] );
		add_action('rest_api_init', function() {
			register_meta('post', 'page_builder', [
				'show_in_rest' => true,
				'single' => true,
				'type' => 'string',
			] );
		} );
	}

	public function init() {
		// Once we get here, We have passed all validation checks, so we can safely include our plugin.
		require_once 'plugin.php';
	}

	/**
	 * Redirect to Angie app page after plugin activation
	 */
	public function redirect_after_activation() {
		// Only redirect if the transient exists
		if ( ! get_transient( 'angie_activation_redirect' ) ) {
			return;
		}

		// Delete the transient so we don't redirect again
		delete_transient( 'angie_activation_redirect' );

		// Don't redirect if we're not in admin area
		if ( ! is_admin() ) {
			return;
		}

		// Don't redirect if we're doing AJAX, running WP-CLI, or REST requests
                if ( wp_doing_ajax() || 
                         ( defined( 'WP_CLI' ) && WP_CLI ) ||
                         ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			return;
		}

		// Don't redirect if the user doesn't have the required capability
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// Check for bulk activation - properly sanitized
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! empty( $_GET['activate-multi'] ) ) {
			return;
		}

		// Don't redirect if headers already sent
		if ( headers_sent() ) {
			return;
		}

		// Perform the redirect
		wp_safe_redirect( admin_url( 'admin.php?page=angie-app' ) );
		exit;
	}

	public static function activate_plugin() {
		require_once __DIR__ . '/plugin.php';

		if ( class_exists( '\Angie\Classes\Angie_Capability_Manager' ) ) {
			\Angie\Classes\Angie_Capability_Manager::add_angie_capability_to_default_roles();
		}
		// Set a transient to redirect on next page load
		set_transient( 'angie_activation_redirect', true, 30 );
	}
}

new Angie();

register_activation_hook( __FILE__, [ 'Angie', 'activate_plugin' ] );
register_uninstall_hook( __FILE__, 'angie_uninstall_cleanup' );

/**
 * Uninstall cleanup - WordPress recommended approach
 * This runs when plugin is deleted via WordPress admin
 */
function angie_uninstall_cleanup() {
	// Reset consent data to ensure clean onboarding flow on reinstall
	delete_option( 'angie_external_scripts_consent' );
	delete_option( 'angie_sidebar_default_state' );
}