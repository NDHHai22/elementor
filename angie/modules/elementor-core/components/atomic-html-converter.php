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

		try {
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

			error_log( 'Atomic Converter: Generated ' . count( $elements ) . ' elements' );
			return $elements;
			
		} catch ( \Exception $e ) {
			error_log( 'Atomic Converter Error: ' . $e->getMessage() );
			error_log( 'Stack trace: ' . $e->getTraceAsString() );
			return [];
		}
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
		
		// Debug logging
		error_log( sprintf( 
			'Parsing <%s>: %d styles found', 
			$tag, 
			count( $styles ) 
		) );
		if ( ! empty( $styles ) ) {
			error_log( 'Styles: ' . print_r( $styles, true ) );
		}
		
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
	 * Detect element role based on HTML tag ONLY (no style inference)
	 */
	private function detect_element_role( $node, $tag ) {
		// Images
		if ( $tag === 'img' ) {
			return 'image';
		}

		// Headings
		if ( in_array( $tag, [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ], true ) ) {
			return 'heading';
		}

		// Buttons (only <button> or <a> tags)
		if ( $tag === 'button' || $tag === 'a' ) {
			return 'button';
		}

		// Check if element has children
		$children = $this->get_element_children( $node );
		if ( count( $children ) > 0 ) {
			return 'container'; // e-div-block
		}

		// Default: text element (e-paragraph)
		return 'text';
	}

	/**
	 * Create Atomic container (e-div-block)
	 */
	private function create_atomic_container( $node, $styles ) {
		$element_id = $this->generate_id();
		
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

		$element = [
			'id'       => $element_id,
			'elType'   => 'e-div-block',
			'isInner'  => false,
			'isLocked' => false,
			'settings' => [], // e-div-block has empty settings
			'defaultEditSettings' => [
				'defaultEditRoute' => 'content',
			],
			'elements' => $children,
			'styles'   => [], // Will be populated if styles exist
			'editor_settings' => [],
			'editSettings' => [
				'defaultEditRoute' => 'content',
			],
			'htmlCache' => null,
		];

		// Add styles if container has any
		if ( ! empty( $styles ) ) {
			$class_id = 'e-' . $element_id . '-' . substr( md5( json_encode( $styles ) ), 0, 7 );
			
			// Add classes to settings
			$element['settings'] = [
				'classes' => [
					'$$type' => 'classes',
					'value'  => [ $class_id ],
				],
			];
			
			// Add styles object
			$element['styles'] = [
				$class_id => $this->create_atomic_style( $class_id, $styles, 'container' ),
			];
		}

		return $element;
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
			'text' => [
				'$$type' => 'string',
				'value'  => trim( $node->textContent ),
			],
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
		$html = $this->get_inner_html( $node );
		return $this->create_atomic_widget( 'e-paragraph', $node, $styles, [
			'paragraph' => [
				'$$type' => 'string',
				'value'  => $html,
			],
		] );
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

		// Only add classes if there are actual styles to apply
		$has_styles = ! empty( $styles );
		
		if ( $has_styles ) {
			$custom_settings['classes'] = [
				'$$type' => 'classes',
				'value'  => [ $class_id ],
			];
		}

		$element = [
			'id'         => $element_id,
			'elType'     => 'widget',
			'isInner'    => false,
			'isLocked'   => false,
			'settings'   => $custom_settings,
			'defaultEditSettings' => [
				'defaultEditRoute' => 'content',
			],
			'elements' => [],
			'widgetType' => $widget_type,
			'htmlCache' => '',
			'editor_settings' => [],
			'editSettings' => [
				'defaultEditRoute' => 'content',
			],
		];

		// Only add styles if there are actual styles
		if ( $has_styles ) {
			$element['styles'] = [
				$class_id => $this->create_atomic_style( $class_id, $styles, $widget_type ),
			];
		}

		return $element;
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

		// Padding/Margin shorthand - expand to dimensions
		if ( $property === 'padding' || $property === 'margin' ) {
			$values = preg_split( '/\s+/', trim( $value ) );
			
			// If single value, use size type
			if ( count( $values ) === 1 ) {
				$parsed = $this->parse_size_value( $values[0] );
				return [
					'name'  => $property,
					'value' => [
						'$$type' => 'size',
						'value'  => $parsed,
					],
				];
			}
			
			// Multiple values - expand to logical properties (block-start, block-end, inline-start, inline-end)
			$dimensions = $this->expand_shorthand_dimensions( $values );
			$dimension_values = [];
			
			// Convert physical directions to logical properties
			$logical_map = [
				'top'    => 'block-start',
				'bottom' => 'block-end',
				'left'   => 'inline-start',
				'right'  => 'inline-end',
			];
			
			foreach ( $dimensions as $side => $side_value ) {
				$parsed = $this->parse_size_value( $side_value );
				$logical_side = $logical_map[ $side ];
				$dimension_values[ $logical_side ] = [
					'$$type' => 'size',
					'value'  => $parsed,
				];
			}
			
			return [
				'name'  => $property,
				'value' => [
					'$$type' => 'dimensions',
					'value'  => $dimension_values,
				],
			];
		}

		// Border-radius - special dimensions type with corner names
		if ( $property === 'border-radius' ) {
			$values = preg_split( '/\s+/', trim( $value ) );
			
			// If single value, use size type
			if ( count( $values ) === 1 ) {
				$parsed = $this->parse_size_value( $values[0] );
				return [
					'name'  => $property,
					'value' => [
						'$$type' => 'size',
						'value'  => $parsed,
					],
				];
			}
			
			// Multiple values - expand to corners using border-radius type
			$corners = $this->expand_border_radius( $values );
			$corner_values = [];
			
			foreach ( $corners as $corner => $corner_value ) {
				$parsed = $this->parse_size_value( $corner_value );
				$corner_values[ $corner ] = [
					'$$type' => 'size',
					'value'  => $parsed,
				];
			}
			
			return [
				'name'  => $property,
				'value' => [
					'$$type' => 'border-radius',
					'value'  => $corner_values,
				],
			];
		}

		// Number properties (no units)
		if ( in_array( $property, [ 'z-index' ], true ) ) {
			return [
				'name'  => $property,
				'value' => [
					'$$type' => 'number',
					'value'  => intval( $value ),
				],
			];
		}

		// Opacity - size type with percentage
		if ( $property === 'opacity' ) {
			$numeric = floatval( $value );
			// Convert 0-1 to 0-100%
			if ( $numeric <= 1 ) {
				$numeric = $numeric * 100;
			}
			return [
				'name'  => $property,
				'value' => [
					'$$type' => 'size',
					'value'  => [
						'size' => $numeric,
						'unit' => '%',
					],
				],
			];
		}

		// Individual size properties (with units)
		$size_props = [
			'font-size', 'width', 'height',
			'max-width', 'min-width', 'max-height', 'min-height',
			'border-width', 'gap',
			'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
			'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
			// Logical properties for positioning
			'inset-block-start', 'inset-block-end', 'inset-inline-start', 'inset-inline-end',
			'scroll-margin-top', 'scroll-margin-bottom', 'scroll-margin-left', 'scroll-margin-right',
			// Physical positioning fallbacks
			'top', 'right', 'bottom', 'left',
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
			'text-transform', 'position', 'overflow', 'cursor',
			'font-family', 'flex-wrap', 'align-content',
			'border-style', 'mix-blend-mode',
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

		// Box-shadow - complex type (skip for now to avoid validation errors)
		if ( $property === 'box-shadow' && $value !== 'none' ) {
			// TODO: Implement proper box-shadow parser
			// Box-shadow is very complex with multiple shadows, inset, etc.
			// For now, skip it to avoid validation errors
			error_log( "Box-shadow skipped (complex property): $value" );
			return null;
		}

		// Transform, transition, filter, backdrop-filter - extremely complex, skip for now
		$complex_props = [ 'transform', 'transition', 'filter', 'backdrop-filter' ];
		if ( in_array( $property, $complex_props, true ) ) {
			error_log( "Complex property skipped: $property = $value" );
			return null;
		}

		// Log unknown properties for debugging
		error_log( "Unknown CSS property skipped: $property = $value" );

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
	 * Expand shorthand dimensions (e.g., "10px 20px" -> top, right, bottom, left)
	 * 
	 * @param array $values Array of size values.
	 * @return array Associative array with 'top', 'right', 'bottom', 'left'.
	 */
	private function expand_shorthand_dimensions( $values ) {
		$count = count( $values );
		
		// 1 value: all sides
		if ( $count === 1 ) {
			return [
				'top'    => $values[0],
				'right'  => $values[0],
				'bottom' => $values[0],
				'left'   => $values[0],
			];
		}
		
		// 2 values: top/bottom, left/right
		if ( $count === 2 ) {
			return [
				'top'    => $values[0],
				'right'  => $values[1],
				'bottom' => $values[0],
				'left'   => $values[1],
			];
		}
		
		// 3 values: top, left/right, bottom
		if ( $count === 3 ) {
			return [
				'top'    => $values[0],
				'right'  => $values[1],
				'bottom' => $values[2],
				'left'   => $values[1],
			];
		}
		
		// 4 values: top, right, bottom, left
		return [
			'top'    => $values[0],
			'right'  => $values[1],
			'bottom' => $values[2],
			'left'   => $values[3],
		];
	}

	/**
	 * Expand border-radius shorthand to corner names
	 * 
	 * @param array $values Array of size values.
	 * @return array Associative array with logical corner names.
	 */
	private function expand_border_radius( $values ) {
		$count = count( $values );
		
		// 1 value: all corners
		if ( $count === 1 ) {
			return [
				'start-start' => $values[0],
				'start-end'   => $values[0],
				'end-start'   => $values[0],
				'end-end'     => $values[0],
			];
		}
		
		// 2 values: top-left/bottom-right, top-right/bottom-left
		if ( $count === 2 ) {
			return [
				'start-start' => $values[0],
				'start-end'   => $values[1],
				'end-start'   => $values[1],
				'end-end'     => $values[0],
			];
		}
		
		// 3 values: top-left, top-right/bottom-left, bottom-right
		if ( $count === 3 ) {
			return [
				'start-start' => $values[0],
				'start-end'   => $values[1],
				'end-start'   => $values[1],
				'end-end'     => $values[2],
			];
		}
		
		// 4 values: top-left, top-right, bottom-right, bottom-left
		return [
			'start-start' => $values[0],
			'start-end'   => $values[1],
			'end-end'     => $values[2],
			'end-start'   => $values[3],
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
