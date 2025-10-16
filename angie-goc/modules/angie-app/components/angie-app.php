<?php

namespace Angie\Modules\AngieApp\Components;

use Angie\Modules\ConsentManager\Module as ConsentManager;
use Angie\Modules\ConsentManager\Components\Consent_Page;
use Angie\Includes\Utils;


if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Angie App Component
 *
 * Creates a page to load the external Angie app via script
 */
class Angie_App {


	public function __construct() {
		add_action( 'admin_menu', [ $this, 'register_admin_menu' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts' ], 1 );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_scripts' ], 1 );
		add_filter( 'body_class', [ $this, 'add_angie_body_class' ] );
	}

	/**
	 * Register the main menu for Angie App
	 *
	 * @param callable|null $callback Callback function to render the page.
	 */
	public static function register_main_menu( $callback = null ) {
		// Custom SVG icon for Angie menu
		$svg_icon = 'data:image/svg+xml;base64,' . base64_encode(
			'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M15.2084 2.70898C15.5536 2.70898 15.8334 2.98881 15.8334 3.33398C15.8334 3.61025 15.9431 3.8752 16.1385 4.07055C16.3338 4.2659 16.5988 4.37565 16.875 4.37565C17.2202 4.37565 17.5 4.65547 17.5 5.00065C17.5 5.34583 17.2202 5.62565 16.875 5.62565C16.5988 5.62565 16.3338 5.7354 16.1385 5.93075C15.9431 6.1261 15.8334 6.39105 15.8334 6.66732C15.8334 7.0125 15.5536 7.29232 15.2084 7.29232C14.8632 7.29232 14.5834 7.0125 14.5834 6.66732C14.5834 6.39105 14.4736 6.1261 14.2783 5.93075C14.0829 5.7354 13.818 5.62565 13.5417 5.62565C13.1965 5.62565 12.9167 5.34583 12.9167 5.00065C12.9167 4.65547 13.1965 4.37565 13.5417 4.37565C13.818 4.37565 14.0829 4.2659 14.2783 4.07055C14.4736 3.8752 14.5834 3.61025 14.5834 3.33398C14.5834 2.98881 14.8632 2.70898 15.2084 2.70898ZM15.2084 4.90687C15.1932 4.92292 15.1778 4.93878 15.1622 4.95444C15.1465 4.97009 15.1306 4.9855 15.1146 5.00065C15.1306 5.01581 15.1465 5.03121 15.1622 5.04686C15.1778 5.06252 15.1932 5.07838 15.2084 5.09444C15.2235 5.07838 15.2389 5.06252 15.2546 5.04686C15.2702 5.03121 15.2861 5.01581 15.3022 5.00065C15.2861 4.9855 15.2702 4.97009 15.2546 4.95444C15.2389 4.93878 15.2235 4.92292 15.2084 4.90687ZM7.70837 4.37565C8.05355 4.37565 8.33337 4.65547 8.33337 5.00065C8.33337 6.16097 8.79431 7.27377 9.61478 8.09424C10.4353 8.91471 11.5481 9.37565 12.7084 9.37565C13.0536 9.37565 13.3334 9.65547 13.3334 10.0007C13.3334 10.3458 13.0536 10.6257 12.7084 10.6257C11.5481 10.6257 10.4353 11.0866 9.61478 11.9071C8.79431 12.7275 8.33337 13.8403 8.33337 15.0007C8.33337 15.3458 8.05355 15.6257 7.70837 15.6257C7.3632 15.6257 7.08337 15.3458 7.08337 15.0007C7.08337 13.8403 6.62244 12.7275 5.80197 11.9071C4.98149 11.0866 3.8687 10.6257 2.70837 10.6257C2.3632 10.6257 2.08337 10.3458 2.08337 10.0007C2.08337 9.65547 2.3632 9.37565 2.70837 9.37565C3.8687 9.37565 4.98149 8.91471 5.80197 8.09424C6.62244 7.27377 7.08337 6.16097 7.08337 5.00065C7.08337 4.65547 7.3632 4.37565 7.70837 4.37565ZM7.70837 7.5776C7.44439 8.08985 7.1009 8.56308 6.68585 8.97813C6.2708 9.39317 5.79757 9.73666 5.28533 10.0007C5.79757 10.2646 6.2708 10.6081 6.68585 11.0232C7.1009 11.4382 7.44439 11.9115 7.70837 12.4237C7.97236 11.9115 8.31585 11.4382 8.7309 11.0232C9.14595 10.6081 9.61918 10.2646 10.1314 10.0007C9.61918 9.73666 9.14595 9.39317 8.7309 8.97813C8.31585 8.56308 7.97236 8.08985 7.70837 7.5776ZM15.2084 12.709C15.5536 12.709 15.8334 12.9888 15.8334 13.334C15.8334 13.6103 15.9431 13.8752 16.1385 14.0706C16.3338 14.2659 16.5988 14.3757 16.875 14.3757C17.2202 14.3757 17.5 14.6555 17.5 15.0007C17.5 15.3458 17.2202 15.6257 16.875 15.6257C16.5988 15.6257 16.3338 15.7354 16.1385 15.9307C15.9431 16.1261 15.8334 16.3911 15.8334 16.6673C15.8334 17.0125 15.5536 17.2923 15.2084 17.2923C14.8632 17.2923 14.5834 17.0125 14.5834 16.6673C14.5834 16.3911 14.4736 16.1261 14.2783 15.9307C14.0829 15.7354 13.818 15.6257 13.5417 15.6257C13.1965 15.6257 12.9167 15.3458 12.9167 15.0007C12.9167 14.6555 13.1965 14.3757 13.5417 14.3757C13.818 14.3757 14.0829 14.2659 14.2783 14.0706C14.4736 13.8752 14.5834 13.6103 14.5834 13.334C14.5834 12.9888 14.8632 12.709 15.2084 12.709ZM15.2084 14.9069C15.1932 14.9229 15.1778 14.9388 15.1622 14.9544C15.1465 14.9701 15.1306 14.9855 15.1146 15.0007C15.1306 15.0158 15.1465 15.0312 15.1622 15.0469C15.1778 15.0625 15.1932 15.0784 15.2084 15.0944C15.2235 15.0784 15.2389 15.0625 15.2546 15.0469C15.2702 15.0312 15.2861 15.0158 15.3022 15.0007C15.2861 14.9855 15.2702 14.9701 15.2546 14.9544C15.2389 14.9388 15.2235 14.9229 15.2084 14.9069Z" fill="white"/>
			</svg>'
		);

		add_menu_page(
			esc_html__( 'Angie', 'angie' ),
			esc_html__( 'Angie', 'angie' ),
			'manage_options',
			'angie-app', // Set the default page to the Angie App.
			$callback,
			$svg_icon,
			3
		);
	}


	public function register_admin_menu() {
		$has_consent = ConsentManager::has_consent();
		
		if ( ! $has_consent ) {
			// No consent: main menu shows welcome page
			$welcome_component = new Consent_Page();
			self::register_main_menu( [ $welcome_component, 'render_consent_page' ] );
		} else {
			// Has consent: main menu shows app page
			self::register_main_menu( [ $this, 'render_app_page' ] );
			
			// Add the Angie App as the first submenu item explicitly to ensure it's labeled correctly.
			add_submenu_page(
				'angie-app',
				esc_html__( 'Angie App', 'angie' ),
				esc_html__( 'Angie App', 'angie' ),
				'manage_options',
				'angie-app',
				[ $this, 'render_app_page' ],
				1 // Lower priority to ensure it appears first.
			);
		}
	}

	public function enqueue_scripts() {
		if ( ! current_user_can( 'use_angie' ) ) {
			return;
		}

		wp_enqueue_style(
			'angie-google-fonts',
			'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
			[],
			null
		);

		// Exclude Site Planner Connect page from loading Angie app script.
		$excluded_pages = [
			'e-site-planner-password-generator',
		];
		// PHPcs:ignore WordPress.Security.NonceVerification.Recommended
		$current_page = Utils::get_sanitized_query_var( 'page' );
		if ( $current_page && in_array( $current_page, $excluded_pages, true ) ) {
			return;
		}

		// Check if user has given consent.
		if ( ! ConsentManager::has_consent() ) {
			return;
		}

		// Register and enqueue the external script.
		wp_enqueue_script(
			'angie-app',
			'https://editor-static-bucket.elementor.com/angie.umd.cjs',
			[ 'wp-api-request' ],
			ANGIE_VERSION,
			false
		);

		$plugins = apply_filters( 'angie_mcp_plugins', [] );

		// Is WooCommerce active?
		if ( Utils::is_plugin_active( 'woocommerce/woocommerce.php' ) ) {
			$plugins['woocommerce'] = [];

			// Only check for single product edit page in admin area where get_current_screen() is available.
			$is_single_product_edit_page = false;
			if ( is_admin() && function_exists( 'get_current_screen' ) ) {
				$screen = get_current_screen();
				if ( $screen ) {
					$is_single_product_edit_page = 'post' === $screen->base && 'product' === $screen->post_type;
				}
			}

			$plugins['woocommerce']['isSingleProductEdit'] = $is_single_product_edit_page;
		}

		if ( Utils::is_plugin_active( 'elementor/elementor.php' ) ) {
			$plugins['elementor'] = [];
		}

		if ( Utils::is_plugin_active( 'elementor-pro/elementor-pro.php' ) ) {
			$plugins['elementor_pro'] = [];
		}

		$post_types_names = array_keys( get_post_types( [
			'show_in_menu' => true,
			'show_in_rest' => true,
		] ) );

		// Get current user data
		$current_user = wp_get_current_user();
		$wp_username = $current_user->exists() ? $current_user->display_name : null;
		$wp_user_role = $current_user->exists() && !empty($current_user->roles) ? $current_user->roles[0] : null;

		// Get Elementor site key
		$site_key = get_option( 'elementor_connect_site_key', null );

		wp_add_inline_script(
			'angie-app',
			'window.angieConfig = ' . wp_json_encode( [
				'plugins' => $plugins,
				'postTypesNames' => $post_types_names,
				'version' => ANGIE_VERSION,
				'wpVersion' => get_bloginfo( 'version' ),
				'wpUsername' => $wp_username,
				'untrusted__wpUserRole' => $wp_user_role, // Used only for analytics - Never use for auth decisions
				'siteKey' => $site_key,
			] ),
			'before'
		);
	}


	private function is_oauth_flow_active() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$is_oauth_return = isset( $_GET['oauth_code'] ) || isset( $_GET['oauth_state'] );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$is_oauth_starting = isset( $_GET['start-oauth'] );
		return [
			'is_starting' => $is_oauth_starting,
			'is_returning' => $is_oauth_return,
			'is_active' => $is_oauth_starting || $is_oauth_return,
		];
	}

	public function render_app_page() {
		$oauth_state = $this->is_oauth_flow_active();
		$is_oauth_starting = $oauth_state['is_starting'];
		$is_oauth_return = $oauth_state['is_returning'];
		$is_in_oauth_flow = $oauth_state['is_active'];
		?>
		<style>
			body {
				background-color: #FFFFFF;
			}
		</style>
		
		<?php if ( ConsentManager::has_consent() ) : ?>
			<div class="angie-app-page" data-testid="angie-app-page">
				<div class="angie-app-layout" data-testid="angie-app-layout">
						<div class="angie-app-start" id="angie-app-start" data-testid="angie-app-start">
						<h4><?php esc_html_e( 'Meet Angie, your new AI assistant', 'angie' ); ?></h4>
						<p><?php esc_html_e( 'Angie understands any WordPress website and can take action across your site. One instruction in Angie replaces dozens of clicks and hours of work. Whether you\'re launching a new About page or putting products on sale across your store, Angie is built for real workflows and keeps your projects moving.', 'angie' ); ?></p>
						<?php if ( $is_in_oauth_flow ) : ?>
							<div class="angie-loading-state" data-testid="angie-loading-state">
								<div class="angie-spinner"></div>
								<p class="angie-loading-text">
									<?php 
									if ( $is_oauth_starting && ! $is_oauth_return ) {
										esc_html_e( 'Redirecting to sign in...', 'angie' );
									} else {
										esc_html_e( 'Completing authentication...', 'angie' );
									}
									?>
								</p>
							</div>
						<?php else : ?>
							<div class="angie-toggle-container">
								<div id="angie-toggle-link" class="angie-toggle-link">
									<span class="angie-toggle-icon">
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
											<path fill-rule="evenodd" clip-rule="evenodd" d="M18.25 3.25C18.6642 3.25 19 3.58579 19 4C19 4.33137 19.1223 4.64931 19.3458 4.87279C19.5693 5.09628 19.8872 5.21863 20.2186 5.21863C20.6328 5.21863 20.9686 5.55442 20.9686 5.96863C20.9686 6.38284 20.6328 6.71863 20.2186 6.71863C19.8872 6.71863 19.5693 6.84098 19.3458 7.06446C19.1223 7.28795 19 7.60588 19 7.93725C19 8.35147 18.6642 8.68725 18.25 8.68725C17.8358 8.68725 17.5 8.35147 17.5 7.93725C17.5 7.60588 17.3777 7.28795 17.1542 7.06446C16.9307 6.84098 16.6128 6.71863 16.2814 6.71863C15.8672 6.71863 15.5314 6.38284 15.5314 5.96863C15.5314 5.55442 15.8672 5.21863 16.2814 5.21863C16.6128 5.21863 16.9307 5.09628 17.1542 4.87279C17.3777 4.64931 17.5 4.33137 17.5 4C17.5 3.58579 17.8358 3.25 18.25 3.25ZM18.25 5.84902C18.2308 5.86831 18.2123 5.8873 18.1939 5.90608C18.1755 5.92486 18.1574 5.9434 18.1392 5.96176C18.1574 5.98013 18.1755 5.99867 18.1939 6.01745C18.2123 6.03623 18.2308 6.05522 18.25 6.07451C18.2692 6.05522 18.2877 6.03623 18.3061 6.01745C18.3245 5.99867 18.3426 5.98013 18.3608 5.96176C18.3426 5.9434 18.3245 5.92486 18.3061 5.90608C18.2877 5.8873 18.2692 5.86831 18.25 5.84902ZM9.25 5.21863C9.66421 5.21863 10 5.55442 10 5.96863C10 7.3592 10.5528 8.68051 11.5355 9.66322C12.5182 10.6459 13.8395 11.2186 15.25 11.2186C15.6642 11.2186 16 11.5544 16 11.9686C16 12.3828 15.6642 12.7186 15.25 12.7186C13.8395 12.7186 12.5182 13.2714 11.5355 14.2541C10.5528 15.2368 10 16.5581 10 17.9686C10 18.3828 9.66421 18.7186 9.25 18.7186C8.83579 18.7186 8.5 18.3828 8.5 17.9686C8.5 16.5581 7.94721 15.2368 6.96447 14.2541C5.98172 13.2714 4.66042 12.7186 3.25 12.7186C2.83579 12.7186 2.5 12.3828 2.5 11.9686C2.5 11.5544 2.83579 11.2186 3.25 11.2186C4.66042 11.2186 5.98172 10.6459 6.96447 9.66322C7.94721 8.68051 8.5 7.3592 8.5 5.96863C8.5 5.55442 8.83579 5.21863 9.25 5.21863ZM9.25 8.96863C8.93284 9.58151 8.52443 10.1342 8.03553 10.6231C7.54664 11.112 6.99395 11.5204 6.38108 11.8326C6.99395 12.1447 7.54664 12.5531 8.03553 13.042C8.52443 13.5309 8.93284 14.0836 9.25 14.6965C9.56716 14.0836 9.97557 13.5309 10.4645 13.042C10.9534 12.5531 11.506 12.1447 12.1189 11.8326C11.506 11.5204 10.9534 11.112 10.4645 10.6231C9.97557 10.1342 9.56716 9.58151 9.25 8.96863ZM18.25 15.25C18.6642 15.25 19 15.5858 19 16C19 16.3314 19.1223 16.6493 19.3458 16.8728C19.5693 17.0963 19.8872 17.2186 20.2186 17.2186C20.6328 17.2186 20.9686 17.5544 20.9686 17.9686C20.9686 18.3828 20.6328 18.7186 20.2186 18.7186C19.8872 18.7186 19.5693 18.841 19.3458 19.0645C19.1223 19.2879 19 19.6059 19 19.9373C19 20.3515 18.6642 20.6873 18.25 20.6873C17.8358 20.6873 17.5 20.3515 17.5 19.9373C17.5 19.6059 17.3777 19.2879 17.1542 19.0645C16.9307 18.841 16.6128 18.7186 16.2814 18.7186C15.8672 18.7186 15.5314 18.3828 15.5314 17.9686C15.5314 17.5544 15.8672 17.2186 16.2814 17.2186C16.6128 17.2186 16.9307 17.0963 17.1542 16.8728C17.3777 16.6493 17.5 16.3314 17.5 16C17.5 15.5858 17.8358 15.25 18.25 15.25ZM18.25 17.849C18.2308 17.8683 18.2123 17.8873 18.1939 17.9061C18.1755 17.9249 18.1574 17.9434 18.1392 17.9618C18.1574 17.9801 18.1755 17.9987 18.1939 18.0174C18.2123 18.0362 18.2308 18.0552 18.25 18.0745C18.2692 18.0552 18.2877 18.0362 18.3061 18.0174C18.3245 17.9987 18.3426 17.9801 18.3608 17.9618C18.3426 17.9434 18.3245 17.9249 18.3061 17.9061C18.2877 17.8873 18.2692 17.8683 18.25 17.849Z" fill="#C00BB9"/>
										</svg>
									</span>
									<?php esc_html_e( 'Toggle Angie', 'angie' ); ?>
								</div>
							</div>
						<?php endif; ?>
					</div>
					
						<div class="angie-app-end" data-testid="angie-app-end">
						<div class="angie-end-container" data-testid="angie-end-container">
							<img src="<?php echo esc_url( Utils::get_asset_url( 'askAngieImage.png', __DIR__ ) ); ?>"
								alt="<?php esc_attr_e( 'Ask Angie AI Assistant', 'angie' ); ?>" 
								class="angie-ask-image" data-testid="angie-ask-image" />
						</div>
					</div>
				</div>
			</div>
			
			<?php $this->render_app_styles(); ?>
			
			<script>
				(function() {
					// Shared SVG icon for Toggle Angie button
					const ANGIE_TOGGLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">' +
						'<path fill-rule="evenodd" clip-rule="evenodd" d="M18.25 3.25C18.6642 3.25 19 3.58579 19 4C19 4.33137 19.1223 4.64931 19.3458 4.87279C19.5693 5.09628 19.8872 5.21863 20.2186 5.21863C20.6328 5.21863 20.9686 5.55442 20.9686 5.96863C20.9686 6.38284 20.6328 6.71863 20.2186 6.71863C19.8872 6.71863 19.5693 6.84098 19.3458 7.06446C19.1223 7.28795 19 7.60588 19 7.93725C19 8.35147 18.6642 8.68725 18.25 8.68725C17.8358 8.68725 17.5 8.35147 17.5 7.93725C17.5 7.60588 17.3777 7.28795 17.1542 7.06446C16.9307 6.84098 16.6128 6.71863 16.2814 6.71863C15.8672 6.71863 15.5314 6.38284 15.5314 5.96863C15.5314 5.55442 15.8672 5.21863 16.2814 5.21863C16.6128 5.21863 16.9307 5.09628 17.1542 4.87279C17.3777 4.64931 17.5 4.33137 17.5 4C17.5 3.58579 17.8358 3.25 18.25 3.25ZM18.25 5.84902C18.2308 5.86831 18.2123 5.8873 18.1939 5.90608C18.1755 5.92486 18.1574 5.9434 18.1392 5.96176C18.1574 5.98013 18.1755 5.99867 18.1939 6.01745C18.2123 6.03623 18.2308 6.05522 18.25 6.07451C18.2692 6.05522 18.2877 6.03623 18.3061 6.01745C18.3245 5.99867 18.3426 5.98013 18.3608 5.96176C18.3426 5.9434 18.3245 5.92486 18.3061 5.90608C18.2877 5.8873 18.2692 5.86831 18.25 5.84902ZM9.25 5.21863C9.66421 5.21863 10 5.55442 10 5.96863C10 7.3592 10.5528 8.68051 11.5355 9.66322C12.5182 10.6459 13.8395 11.2186 15.25 11.2186C15.6642 11.2186 16 11.5544 16 11.9686C16 12.3828 15.6642 12.7186 15.25 12.7186C13.8395 12.7186 12.5182 13.2714 11.5355 14.2541C10.5528 15.2368 10 16.5581 10 17.9686C10 18.3828 9.66421 18.7186 9.25 18.7186C8.83579 18.7186 8.5 18.3828 8.5 17.9686C8.5 16.5581 7.94721 15.2368 6.96447 14.2541C5.98172 13.2714 4.66042 12.7186 3.25 12.7186C2.83579 12.7186 2.5 12.3828 2.5 11.9686C2.5 11.5544 2.83579 11.2186 3.25 11.2186C4.66042 11.2186 5.98172 10.6459 6.96447 9.66322C7.94721 8.68051 8.5 7.3592 8.5 5.96863C8.5 5.55442 8.83579 5.21863 9.25 5.21863ZM9.25 8.96863C8.93284 9.58151 8.52443 10.1342 8.03553 10.6231C7.54664 11.112 6.99395 11.5204 6.38108 11.8326C6.99395 12.1447 7.54664 12.5531 8.03553 13.042C8.52443 13.5309 8.93284 14.0836 9.25 14.6965C9.56716 14.0836 9.97557 13.5309 10.4645 13.042C10.9534 12.5531 11.506 12.1447 12.1189 11.8326C11.506 11.5204 10.9534 11.112 10.4645 10.6231C9.97557 10.1342 9.56716 9.58151 9.25 8.96863ZM18.25 15.25C18.6642 15.25 19 15.5858 19 16C19 16.3314 19.1223 16.6493 19.3458 16.8728C19.5693 17.0963 19.8872 17.2186 20.2186 17.2186C20.6328 17.2186 20.9686 17.5544 20.9686 17.9686C20.9686 18.3828 20.6328 18.7186 20.2186 18.7186C19.8872 18.7186 19.5693 18.841 19.3458 19.0645C19.1223 19.2879 19 19.6059 19 19.9373C19 20.3515 18.6642 20.6873 18.25 20.6873C17.8358 20.6873 17.5 20.3515 17.5 19.9373C17.5 19.6059 17.3777 19.2879 17.1542 19.0645C16.9307 18.841 16.6128 18.7186 16.2814 18.7186C15.8672 18.7186 15.5314 18.3828 15.5314 17.9686C15.5314 17.5544 15.8672 17.2186 16.2814 17.2186C16.6128 17.2186 16.9307 17.0963 17.1542 16.8728C17.3777 16.6493 17.5 16.3314 17.5 16C17.5 15.5858 17.8358 15.25 18.25 15.25ZM18.25 17.849C18.2308 17.8683 18.2123 17.8873 18.1939 17.9061C18.1755 17.9249 18.1574 17.9434 18.1392 17.9618C18.1574 17.9801 18.1755 17.9987 18.1939 18.0174C18.2123 18.0362 18.2308 18.0552 18.25 18.0745C18.2692 18.0552 18.2877 18.0362 18.3061 18.0174C18.3245 17.9987 18.3426 17.9801 18.3608 17.9618C18.3426 17.9434 18.3245 17.9249 18.3061 17.9061C18.2877 17.8873 18.2692 17.8683 18.25 17.849Z" fill="#C00BB9"/>' +
						'</svg>';
					
					// Shared function to create toggle container HTML
					function createToggleContainerHTML() {
						return '<div class="angie-toggle-container">' +
							'<div id="angie-toggle-link" class="angie-toggle-link">' +
								'<span class="angie-toggle-icon">' + ANGIE_TOGGLE_SVG + '</span>' +
								'<?php echo esc_js( esc_html__( 'Toggle Angie', 'angie' ) ); ?>' +
							'</div>' +
						'</div>';
					}
					
					// Common function to attach toggle handler
					function attachToggleHandler() {
						const toggleLink = document.getElementById('angie-toggle-link');
						if (toggleLink && !toggleLink.hasAttribute('data-listener-attached')) {
							toggleLink.setAttribute('data-listener-attached', 'true');
							toggleLink.addEventListener('click', function(e) {
								e.preventDefault();
								if (typeof window.toggleAngieSidebar === 'function') {
									window.toggleAngieSidebar();
								}
							});
						}
					}
					
					// Function to replace loading state with toggle button
					function replaceLoadingWithToggle() {
						const appStart = document.getElementById('angie-app-start');
						if (!appStart) return false;
						
						const loadingState = appStart.querySelector('.angie-loading-state');
						if (!loadingState) return false;
						
						// Create a temporary container to hold the new HTML
						const tempDiv = document.createElement('div');
						tempDiv.innerHTML = createToggleContainerHTML();
						
						// Replace the loading state with the toggle container
						loadingState.parentNode.replaceChild(tempDiv.firstElementChild, loadingState);
						
						// Attach the click handler
						attachToggleHandler();
						
						return true;
					}
					
					// Listen for messages from iframe about authentication status
					window.addEventListener('message', function(event) {
						// Check if message is from iframe about user being already authenticated
						if (event.data && event.data.type === 'ANGIE_USER_ALREADY_AUTHENTICATED') {
							console.log('User already authenticated, replacing loading with Toggle Angie');
							// Replace loading state with toggle button
							if (replaceLoadingWithToggle()) {
								// Open sidebar after a short delay
								setTimeout(() => {
									if (typeof window.toggleAngieSidebar === 'function') {
										window.toggleAngieSidebar(true);
									}
								}, 500);
							}
						}
					});
					
					<?php if ( $is_in_oauth_flow ) : ?>
					const isStarting = <?php echo json_encode( $is_oauth_starting ); ?>;
					const isReturning = <?php echo json_encode( $is_oauth_return ); ?>;
					
					function ensureSidebarClosed() {
						if (typeof window.toggleAngieSidebar === 'function') {
							window.toggleAngieSidebar(false, true);
						}
					}
					
					function isOAuthComplete() {
						const urlParams = new URLSearchParams(window.location.search);
						return !urlParams.has('oauth_code') && !urlParams.has('oauth_state') && !urlParams.has('start-oauth');
					}
					
					function updateUIAfterAuth() {
						const appStart = document.getElementById('angie-app-start');
						if (appStart) {
							appStart.innerHTML = '<h4><?php echo esc_js( esc_html__( 'Meet Angie, your new AI assistant', 'angie' ) ); ?></h4>' +
								'<p><?php echo esc_js( esc_html__( 'Angie lives in your WordPress workspace—drafting text, creating images, and providing handy tips exactly when you need them.', 'angie') ); ?></p>' +
								createToggleContainerHTML();
							
							// Attach handler to the newly created element
							attachToggleHandler();
						}
					}
					
					function openSidebarAfterAuth() {
						try {
							localStorage.setItem('angie_sidebar_state', 'open');
						} catch (e) {}
						if (typeof window.toggleAngieSidebar === 'function') {
							setTimeout(() => window.toggleAngieSidebar(true), 500);
						}
					}
					
					function monitorAuthCompletion() {
						let authenticationSuccessful = false;
						const checkInterval = setInterval(function() {
							const sidebar = document.getElementById('angie-sidebar-container');
							if (sidebar?.querySelector('iframe') && isOAuthComplete()) {
								updateUIAfterAuth();
								clearInterval(checkInterval);
								authenticationSuccessful = true;
								openSidebarAfterAuth();
								window.location.reload(); // Reload to update MCPs
							}
						}, 500);
						
						setTimeout(function() {
							clearInterval(checkInterval);
							if (!authenticationSuccessful) {
								console.log('OAuth authentication timed out');
								ensureSidebarClosed();
							}
						}, 30000);
					}
					
					ensureSidebarClosed();
					
					if (isStarting && !isReturning) {
						console.log('OAuth flow starting, waiting for redirect...');
					} else if (isReturning) {
						monitorAuthCompletion();
					}
					<?php else : ?>
					// Not in OAuth flow - just attach the toggle handler
					document.addEventListener('DOMContentLoaded', attachToggleHandler);
					// Also try to attach immediately in case DOM is already loaded
					attachToggleHandler();
					<?php endif; ?>
				})();
			</script>
		<?php else : ?>
			<div class="wrap">
				<div class="angie-consent-required">
					<span class="dashicons dashicons-lock"></span>
					<h2><?php esc_html_e( 'External Scripts Consent Required', 'angie' ); ?></h2>
					<p><?php esc_html_e( 'To use the Angie App, you need to approve loading external scripts.', 'angie' ); ?></p>
					<p>
						<a href="<?php echo esc_url( admin_url( 'admin.php?page=angie-consent' ) ); ?>" class="button button-primary">
							<?php esc_html_e( 'Get Started with Angie', 'angie' ); ?>
						</a>
					</p>
				</div>
			</div>
		<?php endif; ?>
		<?php
	}

	private function render_app_styles() {
		wp_enqueue_style(
			'angie-app',
			Utils::get_asset_url( 'app-styles.css', __DIR__ ),
			[],
			ANGIE_VERSION
		);
	}

	public function add_angie_body_class( $classes ) {
		$classes[] = 'angie-default';
		return $classes;
	}
}
