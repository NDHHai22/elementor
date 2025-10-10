<?php
/**
 * HTML to Elementor Converter
 * 
 * Component này chuyển đổi HTML thuần sang Elementor JSON structure
 * Tương tự như cách Elementor AI chuyển đổi, nhưng đơn giản hơn
 * 
 * @package Angie
 * @subpackage ElementorCore
 */

namespace Angie\Modules\ElementorCore\Components;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * HTML Parser and Converter
 * 
 * Chuyển đổi HTML sang Elementor element structure
 */
class Html_To_Elementor_Converter {

	/**
	 * REST API namespace
	 */
	const REST_NAMESPACE = 'angie/v1';

	/**
	 * REST API route
	 */
	const REST_ROUTE = 'html-to-elementor';

	/**
	 * Constructor - Register REST API
	 */
	public function __construct() {
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
				'callback'            => [ $this, 'convert_html_to_elementor' ],
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
				'args'                => [
					'html' => [
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'wp_kses_post',
						'description'       => 'HTML string to convert',
					],
				],
			]
		);
	}

	/**
	 * Convert HTML to Elementor format (REST API callback)
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error Response hoặc error.
	 */
	public function convert_html_to_elementor( $request ) {
		$html = $request->get_param( 'html' );

		if ( empty( $html ) ) {
			return new \WP_Error(
				'empty_html',
				'HTML content is empty',
				[ 'status' => 400 ]
			);
		}

		try {
			$elements = $this->parse_html_to_elements( $html );

			return rest_ensure_response(
				[
					'success'  => true,
					'elements' => $elements,
					'message'  => 'HTML converted successfully',
				]
			);
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'conversion_error',
				$e->getMessage(),
				[ 'status' => 500 ]
			);
		}
	}

	/**
	 * Parse HTML string và convert sang Elementor elements
	 *
	 * @param string $html HTML string.
	 * @return array Array of Elementor elements.
	 */
	public function parse_html_to_elements( $html ) {
		// Load HTML vào DOMDocument
		$dom = new \DOMDocument();
		libxml_use_internal_errors( true );
		$dom->loadHTML( '<?xml encoding="utf-8" ?>' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD );
		libxml_clear_errors();

		$elements = [];

		// Parse body children
		$body = $dom->getElementsByTagName( 'body' )->item( 0 );
		if ( $body ) {
			foreach ( $body->childNodes as $node ) {
				if ( $node->nodeType === XML_ELEMENT_NODE ) {
					$element = $this->parse_node_to_element( $node );
					if ( $element ) {
						$elements[] = $element;
					}
				}
			}
		}

		// Nếu không có elements, tạo một section với HTML widget
		if ( empty( $elements ) ) {
			$elements[] = $this->create_section_with_html( $html );
		}

		return $elements;
	}

	/**
	 * Parse DOM node sang Elementor element
	 *
	 * @param \DOMNode $node DOM node.
	 * @return array|null Elementor element hoặc null.
	 */
	private function parse_node_to_element( $node ) {
		$tag_name = strtolower( $node->nodeName );

		// Map HTML tags to Elementor widgets
		switch ( $tag_name ) {
			case 'h1':
			case 'h2':
			case 'h3':
			case 'h4':
			case 'h5':
			case 'h6':
				return $this->create_heading_element( $node, $tag_name );

			case 'p':
				return $this->create_text_element( $node );

			case 'img':
				return $this->create_image_element( $node );

			case 'a':
				return $this->create_button_element( $node );

			case 'div':
			case 'section':
				return $this->create_container_element( $node );

			case 'ul':
			case 'ol':
				return $this->create_list_element( $node );

			default:
				// Default: create text editor với raw HTML
				return $this->create_html_widget( $node );
		}
	}

	/**
	 * Tạo Heading element
	 *
	 * @param \DOMNode $node DOM node.
	 * @param string   $tag Tag name (h1-h6).
	 * @return array Elementor heading element.
	 */
	private function create_heading_element( $node, $tag ) {
		$text = trim( $node->textContent );

		return [
			'id'         => $this->generate_element_id(),
			'elType'     => 'widget',
			'widgetType' => 'heading',
			'settings'   => [
				'title'      => $text,
				'header_size' => $tag,
				'_element_id' => '',
			],
		];
	}

	/**
	 * Tạo Text Editor element
	 *
	 * @param \DOMNode $node DOM node.
	 * @return array Elementor text element.
	 */
	private function create_text_element( $node ) {
		$html = $this->get_inner_html( $node );

		return [
			'id'         => $this->generate_element_id(),
			'elType'     => 'widget',
			'widgetType' => 'text-editor',
			'settings'   => [
				'editor'      => $html,
				'_element_id' => '',
			],
		];
	}

	/**
	 * Tạo Image element
	 *
	 * @param \DOMNode $node DOM node.
	 * @return array Elementor image element.
	 */
	private function create_image_element( $node ) {
		$src = $node->getAttribute( 'src' );
		$alt = $node->getAttribute( 'alt' );

		return [
			'id'         => $this->generate_element_id(),
			'elType'     => 'widget',
			'widgetType' => 'image',
			'settings'   => [
				'image'       => [
					'url' => $src,
					'id'  => '',
				],
				'image_alt'   => $alt,
				'_element_id' => '',
			],
		];
	}

	/**
	 * Tạo Button element
	 *
	 * @param \DOMNode $node DOM node.
	 * @return array Elementor button element.
	 */
	private function create_button_element( $node ) {
		$text = trim( $node->textContent );
		$href = $node->getAttribute( 'href' );

		return [
			'id'         => $this->generate_element_id(),
			'elType'     => 'widget',
			'widgetType' => 'button',
			'settings'   => [
				'text'        => $text,
				'link'        => [
					'url'         => $href,
					'is_external' => false,
					'nofollow'    => false,
				],
				'_element_id' => '',
			],
		];
	}

	/**
	 * Tạo Container element (section với column)
	 *
	 * @param \DOMNode $node DOM node.
	 * @return array Elementor container element.
	 */
	private function create_container_element( $node ) {
		$children = [];

		foreach ( $node->childNodes as $child ) {
			if ( $child->nodeType === XML_ELEMENT_NODE ) {
				$element = $this->parse_node_to_element( $child );
				if ( $element ) {
					$children[] = $element;
				}
			}
		}

		// Tạo section với một column
		return [
			'id'       => $this->generate_element_id(),
			'elType'   => 'section',
			'settings' => [
				'_element_id' => '',
			],
			'elements' => [
				[
					'id'       => $this->generate_element_id(),
					'elType'   => 'column',
					'settings' => [
						'_column_size' => 100,
						'_element_id'  => '',
					],
					'elements' => $children,
				],
			],
		];
	}

	/**
	 * Tạo List element (Icon List widget)
	 *
	 * @param \DOMNode $node DOM node.
	 * @return array Elementor icon list element.
	 */
	private function create_list_element( $node ) {
		$items = [];

		foreach ( $node->childNodes as $li ) {
			if ( $li->nodeType === XML_ELEMENT_NODE && $li->nodeName === 'li' ) {
				$items[] = [
					'text' => trim( $li->textContent ),
					'icon' => [
						'value'   => 'fas fa-check',
						'library' => 'fa-solid',
					],
				];
			}
		}

		return [
			'id'         => $this->generate_element_id(),
			'elType'     => 'widget',
			'widgetType' => 'icon-list',
			'settings'   => [
				'icon_list'   => $items,
				'_element_id' => '',
			],
		];
	}

	/**
	 * Tạo HTML widget (fallback cho unknown tags)
	 *
	 * @param \DOMNode $node DOM node.
	 * @return array Elementor HTML widget.
	 */
	private function create_html_widget( $node ) {
		$html = $this->get_outer_html( $node );

		return [
			'id'         => $this->generate_element_id(),
			'elType'     => 'widget',
			'widgetType' => 'html',
			'settings'   => [
				'html'        => $html,
				'_element_id' => '',
			],
		];
	}

	/**
	 * Tạo section với HTML widget (fallback)
	 *
	 * @param string $html HTML string.
	 * @return array Elementor section với HTML widget.
	 */
	private function create_section_with_html( $html ) {
		return [
			'id'       => $this->generate_element_id(),
			'elType'   => 'section',
			'settings' => [
				'_element_id' => '',
			],
			'elements' => [
				[
					'id'       => $this->generate_element_id(),
					'elType'   => 'column',
					'settings' => [
						'_column_size' => 100,
						'_element_id'  => '',
					],
					'elements' => [
						[
							'id'         => $this->generate_element_id(),
							'elType'     => 'widget',
							'widgetType' => 'html',
							'settings'   => [
								'html'        => $html,
								'_element_id' => '',
							],
						],
					],
				],
			],
		];
	}

	/**
	 * Get inner HTML của node
	 *
	 * @param \DOMNode $node DOM node.
	 * @return string Inner HTML.
	 */
	private function get_inner_html( $node ) {
		$html = '';
		foreach ( $node->childNodes as $child ) {
			$html .= $node->ownerDocument->saveHTML( $child );
		}
		return trim( $html );
	}

	/**
	 * Get outer HTML của node
	 *
	 * @param \DOMNode $node DOM node.
	 * @return string Outer HTML.
	 */
	private function get_outer_html( $node ) {
		return trim( $node->ownerDocument->saveHTML( $node ) );
	}

	/**
	 * Generate unique element ID
	 *
	 * @return string Unique ID.
	 */
	private function generate_element_id() {
		return dechex( mt_rand( 0x10000000, 0xFFFFFFFF ) );
	}
}
