<?php
/**
 * JSON to HTML Converter REST API
 * 
 * Component này cung cấp REST endpoint để chuyển đổi Elementor v4 JSON sang HTML
 * 
 * @package Angie
 * @subpackage ElementorCore
 */

namespace Angie\Modules\ElementorCore\Components;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Load the Atomic JSON to HTML Converter
require_once __DIR__ . '/atomic-json-to-html-converter.php';

/**
 * JSON to HTML Converter
 */
class Json_To_Html_Converter {

	/**
	 * REST API namespace
	 */
	const REST_NAMESPACE = 'angie/v1';

	/**
	 * REST API route
	 */
	const REST_ROUTE = 'json-to-html';

	/**
	 * Atomic HTML to JSON converter
	 *
	 * @var Atomic_Json_To_Html_Converter
	 */
	private $converter;

	/**
	 * Constructor - Register REST API
	 */
	public function __construct() {
		$this->converter = new Atomic_Json_To_Html_Converter();
		add_action( 'rest_api_init', [ $this, 'register_routes' ] );
	}

	/**
	 * Register REST API routes
	 */
	public function register_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_ROUTE,
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'convert_json_to_html' ],
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
				'args'                => [
					'elements' => [
						'required'          => true,
						'type'              => 'array',
						'description'       => 'Array of Elementor JSON elements',
					],
				],
			]
		);
	}

	/**
	 * Convert JSON to HTML (REST API callback)
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error Response hoặc error.
	 */
	public function convert_json_to_html( $request ) {
		$elements = $request->get_param( 'elements' );

		if ( empty( $elements ) ) {
			return new \WP_Error(
				'empty_elements',
				'Elements array is empty',
				[ 'status' => 400 ]
			);
		}

		try {
			// Ensure elements is an array
			if ( ! is_array( $elements ) ) {
				$elements = [ $elements ];
			}

			// Convert JSON to HTML
			$html = $this->converter->convert( $elements );

			return new \WP_REST_Response(
				[
					'success' => true,
					'html'    => $html,
				],
				200
			);
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'conversion_error',
				'Error converting JSON to HTML: ' . $e->getMessage(),
				[ 'status' => 500 ]
			);
		}
	}
}
