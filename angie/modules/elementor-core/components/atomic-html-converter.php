<?php
/**
 * Atomic HTML to Elementor v4 Converter
 * 
 * Converts HTML with inline CSS to Elementor v4 Atomic Elements format
 * 
 * Key differences from v3:
 * - Uses e-div-block instead of section/column
 * - Styles separated into styles object with CSS classes
 * - All values are typed ($$type)
 * - Responsive variants instead of separate mobile/tablet settings
 * 
 * @package Angie
 * @subpackage ElementorCore
 */

namespace Angie\Modules\ElementorCore\Components;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Atomic HTML Parser for Elementor v4
 */
class Atomic_Html_Converter {

	/**
	 * Parse HTML to Atomic Elements
	 *
	 * @param string $html HTML string.
	 * @return array Array of Atomic elements.
	 */
	public function parse( $html ) {
		if ( empty( $html ) ) {
			error_log( 'Atomic Converter: Empty HTML input' );
			return [];
		}

		error_log( '=== Atomic Converter Parse ===' );

		$dom = new \DOMDocument();
		libxml_use_internal_errors( true );
		
		$wrapped_html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>' . $html . '</body></html>';
		$dom->loadHTML( $wrapped_html );
		libxml_clear_errors();

		$elements = [];
		$body = $dom->getElementsByTagName( 'body' )->item( 0 );

		if ( $body && $body->hasChildNodes() ) {
			foreach ( $body->childNodes as $node ) {
				if ( $node->nodeType === XML_ELEMENT_NODE ) {
					$element = $this->parse_node( $node );
					if ( $element ) {
						$elements[] = $element;
					}
				}
			}
		}

		return $elements;
	}

	/**
	 * Parse DOM node to Atomic element
	 *
	 * @param \DOMNode $node DOM node.
	 * @return array|null Atomic element or null.
	 */
	private function parse_node( $node ) {
		$tag = strtolower( $node->nodeName );
		$styles = $this->parse_inline_styles( $node );
		
		// Determine element type
		$role = $this->detect_element_role( $node, $tag );
		
		// Create element based on role
		switch ( $role ) {
			case 'container':
				return $this->create_atomic_container( $node, $styles );
			
			case 'heading':
				return $this->create_atomic_heading( $node, $styles, $tag );
			
			case 'button':
				return $this->create_atomic_button( $node, $styles );
			
			case 'image':
				return $this->create_atomic_image( $node, $styles );
			
			case 'text':
			default:
				return $this->create_atomic_text( $node, $styles );
		}
	}

	/**
	 * Detect element role
	 */
	private function detect_element_role( $node, $tag ) {
		if ( $tag === 'img' ) {
			return 'image';
		}

		if ( in_array( $tag, [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ], true ) ) {
			return 'heading';
		}

		if ( $tag === 'button' || $tag === 'a' ) {
			return 'button';
		}

		$children = $this->get_element_children( $node );
		if ( count( $children ) > 0 ) {
			return 'container';
		}

		return 'text';
	}

	/**
	 * Create Atomic container (e-div-block)
	 */
	private function create_atomic_container( $node, $styles ) {
		$element_id = $this->generate_id();
		$class_id = 'e-' . $element_id . '-' . substr( md5( json_encode( $styles ) ), 0, 7 );
		
		// Parse children
		$children = [];
		foreach ( $node->childNodes as $child ) {
			if ( $child->nodeType === XML_ELEMENT_NODE ) {
				$child_element = $this->parse_node( $child );
				if ( $child_element ) {
					$children[] = $child_element;
				}
			}
		}

		return [
			'id'       => $element_id,
			'elType'   => 'e-div-block',
			'isInner'  => false,
			'isLocked' => false,
			'settings' => [
				'classes' => [
					'$$type' => 'classes',
					'value'  => [ $class_id ],
				],
			],
			'defaultEditSettings' => [
				'defaultEditRoute' => 'content',
			],
			'elements' => $children,
			'widgetType' => '', // e-div-block has empty widgetType
			'editSettings' => [
				'defaultEditRoute' => 'content',
			],
			'htmlCache' => null,
			'styles'   => [
				$class_id => $this->create_atomic_style( $class_id, $styles, 'container' ),
			],
		];
	}

	/**
	 * Create Atomic heading (e-heading widget)
	 */
	private function create_atomic_heading( $node, $styles, $tag ) {
		return $this->create_atomic_widget( 'e-heading', $node, $styles, [
			'title' => trim( $node->textContent ),
			'tag'   => $tag,
		] );
	}

	/**
	 * Create Atomic button (e-button widget)
	 */
	private function create_atomic_button( $node, $styles ) {
		$href = $node->getAttribute( 'href' );
		return $this->create_atomic_widget( 'e-button', $node, $styles, [
			'text' => trim( $node->textContent ),
			'link' => [
				'url'         => $href,
				'is_external' => '',
				'nofollow'    => '',
			],
		] );
	}

	/**
	 * Create Atomic text (e-paragraph widget for v4)
	 */
	private function create_atomic_text( $node, $styles ) {
		return $this->create_atomic_widget( 'e-paragraph', $node, $styles, [] );
	}

	/**
	 * Create Atomic image (e-image widget)
	 */
	private function create_atomic_image( $node, $styles ) {
		$src = $node->getAttribute( 'src' );
		$alt = $node->getAttribute( 'alt' );
		return $this->create_atomic_widget( 'e-image', $node, $styles, [
			'image' => [
				'url' => $src,
				'id'  => '',
			],
			'alt' => $alt,
		] );
	}

	/**
	 * Universal Atomic widget creator
	 * 
	 * @param string $widget_type Widget type (e-heading, e-button, etc.)
	 * @param \DOMNode $node DOM node
	 * @param array $styles CSS styles
	 * @param array $custom_settings Additional settings specific to widget
	 * @return array Atomic element
	 */
	private function create_atomic_widget( $widget_type, $node, $styles, $custom_settings = [] ) {
		$element_id = $this->generate_id();
		$class_id = 'e-' . $element_id . '-' . substr( md5( json_encode( $styles ) ), 0, 7 );

		// Merge custom settings with classes
		$settings = array_merge( $custom_settings, [
			'classes' => [
				'$$type' => 'classes',
				'value'  => [ $class_id ],
			],
		] );

		return [
			'id'         => $element_id,
			'elType'     => 'widget',
			'widgetType' => $widget_type,
			'isInner'    => false,
			'isLocked'   => false,
			'settings'   => $settings,
			'defaultEditSettings' => [
				'defaultEditRoute' => 'content',
			],
			'elements' => [],
			'editSettings' => [
				'defaultEditRoute' => 'content',
			],
			'htmlCache' => '',
			'styles'   => [
				$class_id => $this->create_atomic_style( $class_id, $styles, $widget_type ),
			],
		];
	}

	/**
	 * Create Atomic style object
	 *
	 * @param string $class_id Class ID.
	 * @param array $css_styles CSS styles.
	 * @param string $element_type Element type.
	 * @return array Style object.
	 */
	private function create_atomic_style( $class_id, $css_styles, $element_type = 'container' ) {
		$props = [];

		// Convert CSS to Atomic typed props
		foreach ( $css_styles as $property => $value ) {
			$atomic_prop = $this->css_to_atomic_prop( $property, $value );
			if ( $atomic_prop ) {
				$props[ $atomic_prop['name'] ] = $atomic_prop['value'];
			}
		}

		return [
			'id'    => $class_id,
			'label' => 'local',
			'type'  => 'class',
			'variants' => [
				[
					'meta' => [
						'breakpoint' => 'desktop',
						'state'      => null,
					],
					'props'      => $props,
					'custom_css' => null,
				],
			],
		];
	}

	/**
	 * Convert CSS property to Atomic typed prop
	 *
	 * @param string $property CSS property name.
	 * @param string $value CSS value.
	 * @return array|null Atomic prop or null.
	 */
	private function css_to_atomic_prop( $property, $value ) {
		// Color properties
		if ( in_array( $property, [ 'color', 'border-color' ], true ) ) {
			return [
				'name'  => $property,
				'value' => [
					'$$type' => 'color',
					'value'  => $value,
				],
			];
		}

		// Background
		if ( $property === 'background-color' || $property === 'background' ) {
			return [
				'name'  => 'background',
				'value' => [
					'$$type' => 'background',
					'value'  => [
						'color' => [
							'$$type' => 'color',
							'value'  => $value,
						],
					],
				],
			];
		}

		// Size properties (with units)
		$size_props = [
			'font-size', 'padding', 'margin', 'width', 'height',
			'max-width', 'min-width', 'max-height', 'min-height',
			'border-radius', 'border-width', 'gap',
			'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
			'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
		];

		if ( in_array( $property, $size_props, true ) ) {
			$parsed = $this->parse_size_value( $value );
			return [
				'name'  => $property,
				'value' => [
					'$$type' => 'size',
					'value'  => $parsed,
				],
			];
		}

		// String properties (no type conversion needed)
		$string_props = [
			'display', 'flex-direction', 'justify-content', 'align-items',
			'text-align', 'font-weight', 'text-decoration', 'font-style',
			'text-transform', 'position', 'overflow',
		];

		if ( in_array( $property, $string_props, true ) ) {
			return [
				'name'  => $property,
				'value' => [
					'$$type' => 'string',
					'value'  => $value,
				],
			];
		}

		// Unknown property - skip
		return null;
	}

	/**
	 * Parse size value (e.g., "10px" -> ["size" => 10, "unit" => "px"])
	 */
	private function parse_size_value( $value ) {
		$value = trim( $value );
		preg_match( '/^([\d.]+)(.*)$/', $value, $matches );

		return [
			'size' => ! empty( $matches[1] ) ? floatval( $matches[1] ) : 0,
			'unit' => ! empty( $matches[2] ) ? trim( $matches[2] ) : 'px',
		];
	}

	/**
	 * Parse inline styles to array
	 */
	private function parse_inline_styles( $node ) {
		$style_attr = $node->getAttribute( 'style' );
		if ( empty( $style_attr ) ) {
			return [];
		}

		$styles = [];
		$declarations = explode( ';', $style_attr );

		foreach ( $declarations as $declaration ) {
			$parts = explode( ':', $declaration, 2 );
			if ( count( $parts ) === 2 ) {
				$property = trim( $parts[0] );
				$value = trim( $parts[1] );
				$styles[ $property ] = $value;
			}
		}

		return $styles;
	}

	/**
	 * Get element children (excluding text nodes)
	 */
	private function get_element_children( $node ) {
		$children = [];

		foreach ( $node->childNodes as $child ) {
			if ( $child->nodeType === XML_ELEMENT_NODE ) {
				$children[] = $child;
			}
		}

		return $children;
	}

	/**
	 * Get inner HTML of node
	 */
	private function get_inner_html( $node ) {
		$html = '';
		foreach ( $node->childNodes as $child ) {
			$html .= $node->ownerDocument->saveHTML( $child );
		}
		return $html;
	}

	/**
	 * Generate unique element ID
	 */
	private function generate_id() {
		return substr( md5( uniqid( '', true ) ), 0, 7 );
	}
}
