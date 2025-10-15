<?php

namespace Angie\Modules\ElementorCore\Components;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * AI Settings Component
 *
 * Handles OpenAI API settings storage and retrieval
 */
class AI_Settings {

	/**
	 * REST API namespace
	 *
	 * @var string
	 */
	protected $namespace = 'angie/v1';

	/**
	 * REST API base
	 *
	 * @var string
	 */
	protected $rest_base = 'ai-settings';

	/**
	 * Option name for AI settings
	 *
	 * @var string
	 */
	const SETTINGS_OPTION = '_angie_ai_settings';

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'rest_api_init', [ $this, 'register_routes' ] );
	}

	/**
	 * Register REST API routes
	 */
	public function register_routes() {
		// GET settings
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'get_settings' ],
				'permission_callback' => [ $this, 'permissions_check' ],
			]
		);

		// POST/UPDATE settings
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'update_settings' ],
				'permission_callback' => [ $this, 'permissions_check' ],
				'args'                => [
					'api_key' => [
						'type'              => 'string',
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
						'description'       => 'OpenAI API Key',
					],
					'endpoint' => [
						'type'              => 'string',
						'required'          => false,
						'sanitize_callback' => 'esc_url_raw',
						'description'       => 'Custom API Endpoint URL',
					],
					'model' => [
						'type'              => 'string',
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
						'description'       => 'Model name (e.g., gpt-4, gpt-3.5-turbo)',
					],
					'temperature' => [
						'type'              => 'number',
						'required'          => false,
						'default'           => 0.7,
						'description'       => 'Temperature (0-2)',
					],
				],
			]
		);

		// Test connection
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/test',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'test_connection' ],
				'permission_callback' => [ $this, 'permissions_check' ],
			]
		);
	}

	/**
	 * Check permissions
	 *
	 * @return bool
	 */
	public function permissions_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get default settings
	 *
	 * @return array
	 */
	private function get_default_settings() {
		return [
			'api_key'     => '',
			'endpoint'    => 'https://api.openai.com/v1',
			'model'       => 'gpt-4',
			'temperature' => 0.7,
		];
	}

	/**
	 * Get AI settings
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public function get_settings( $request ) {
		$settings = get_option( self::SETTINGS_OPTION, [] );
		
		// Merge with defaults
		$settings = wp_parse_args( $settings, $this->get_default_settings() );

		// Mask API key for security
		if ( ! empty( $settings['api_key'] ) ) {
			$key_length = strlen( $settings['api_key'] );
			if ( $key_length > 8 ) {
				$settings['api_key_masked'] = substr( $settings['api_key'], 0, 4 ) . 
					str_repeat( '*', $key_length - 8 ) . 
					substr( $settings['api_key'], -4 );
			} else {
				$settings['api_key_masked'] = str_repeat( '*', $key_length );
			}
			$settings['has_api_key'] = true;
		} else {
			$settings['api_key_masked'] = '';
			$settings['has_api_key'] = false;
		}

		// Don't send actual API key to frontend
		unset( $settings['api_key'] );

		return rest_ensure_response( [
			'success' => true,
			'data'    => $settings,
		] );
	}

	/**
	 * Update AI settings
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_settings( $request ) {
		$current_settings = get_option( self::SETTINGS_OPTION, [] );
		$current_settings = wp_parse_args( $current_settings, $this->get_default_settings() );

		// Update only provided fields
		$params = $request->get_json_params() ?: $request->get_body_params();
		
		if ( isset( $params['api_key'] ) ) {
			$current_settings['api_key'] = sanitize_text_field( $params['api_key'] );
		}

		if ( isset( $params['endpoint'] ) ) {
			$current_settings['endpoint'] = esc_url_raw( $params['endpoint'] );
		}

		if ( isset( $params['model'] ) ) {
			$current_settings['model'] = sanitize_text_field( $params['model'] );
		}

		if ( isset( $params['temperature'] ) ) {
			$temp = floatval( $params['temperature'] );
			$current_settings['temperature'] = max( 0, min( 2, $temp ) );
		}

		$updated = update_option( self::SETTINGS_OPTION, $current_settings );

		if ( ! $updated && get_option( self::SETTINGS_OPTION ) !== $current_settings ) {
			return new \WP_Error(
				'update_failed',
				__( 'Failed to update AI settings.', 'angie' ),
				[ 'status' => 500 ]
			);
		}

		return rest_ensure_response( [
			'success' => true,
			'message' => __( 'Settings updated successfully.', 'angie' ),
			'data'    => $current_settings,
		] );
	}

	/**
	 * Test OpenAI connection
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function test_connection( $request ) {
		$settings = get_option( self::SETTINGS_OPTION, [] );
		$settings = wp_parse_args( $settings, $this->get_default_settings() );

		if ( empty( $settings['api_key'] ) ) {
			return new \WP_Error(
				'missing_api_key',
				__( 'API Key is required.', 'angie' ),
				[ 'status' => 400 ]
			);
		}

		// Test with a simple completion
		$response = wp_remote_post(
			trailingslashit( $settings['endpoint'] ) . 'chat/completions',
			[
				'headers' => [
					'Content-Type'  => 'application/json',
					'Authorization' => 'Bearer ' . $settings['api_key'],
				],
				'body'    => wp_json_encode( [
					'model'    => $settings['model'],
					'messages' => [
						[
							'role'    => 'user',
							'content' => 'Say "Connection successful!"',
						],
					],
					'max_tokens' => 10,
				] ),
				'timeout' => 30,
			]
		);

		if ( is_wp_error( $response ) ) {
			return new \WP_Error(
				'connection_failed',
				sprintf( __( 'Connection failed: %s', 'angie' ), $response->get_error_message() ),
				[ 'status' => 500 ]
			);
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status_code !== 200 ) {
			$error_message = isset( $body['error']['message'] ) 
				? $body['error']['message'] 
				: __( 'Unknown error', 'angie' );

			return new \WP_Error(
				'api_error',
				sprintf( __( 'API Error (%d): %s', 'angie' ), $status_code, $error_message ),
				[ 'status' => $status_code ]
			);
		}

		return rest_ensure_response( [
			'success' => true,
			'message' => __( 'Connection successful!', 'angie' ),
			'data'    => [
				'model'    => $settings['model'],
				'response' => isset( $body['choices'][0]['message']['content'] ) 
					? $body['choices'][0]['message']['content'] 
					: '',
			],
		] );
	}

	/**
	 * Get API key (internal use only)
	 *
	 * @return string
	 */
	public static function get_api_key() {
		$settings = get_option( self::SETTINGS_OPTION, [] );
		return isset( $settings['api_key'] ) ? $settings['api_key'] : '';
	}

	/**
	 * Get endpoint URL (internal use only)
	 *
	 * @return string
	 */
	public static function get_endpoint() {
		$settings = get_option( self::SETTINGS_OPTION, [] );
		return isset( $settings['endpoint'] ) ? $settings['endpoint'] : 'https://api.openai.com/v1';
	}

	/**
	 * Get model name (internal use only)
	 *
	 * @return string
	 */
	public static function get_model() {
		$settings = get_option( self::SETTINGS_OPTION, [] );
		return isset( $settings['model'] ) ? $settings['model'] : 'gpt-4';
	}

	/**
	 * Get temperature (internal use only)
	 *
	 * @return float
	 */
	public static function get_temperature() {
		$settings = get_option( self::SETTINGS_OPTION, [] );
		return isset( $settings['temperature'] ) ? floatval( $settings['temperature'] ) : 0.7;
	}
}
