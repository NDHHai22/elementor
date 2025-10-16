<?php
/**
 * Smart HTML to Elementor Converter
 * 
 * Advanced converter that:
 * - Parses inline CSS to Elementor settings
 * - Detects semantic structure
 * - Creates proper widgets instead of HTML widgets
 * 
 * @package Angie
 * @subpackage ElementorCore
 */

namespace Angie\Modules\ElementorCore\Components;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Smart HTML Parser
 */
class Smart_Html_Converter {

	/**
	 * Parse HTML to Elementor elements with smart detection
	 *
	 * @param string $html HTML string.
	 * @return array Array of Elementor elements.
	 */
	public function parse( $html ) {
		if ( empty( $html ) ) {
			error_log( 'Smart Converter: Empty HTML input' );
			return [];
		}

		error_log( '=== Smart Converter Parse ===' );
		error_log( 'Input HTML: ' . substr( $html, 0, 300 ) );

		$dom = new \DOMDocument();
		libxml_use_internal_errors( true );
		
		// Wrap HTML in UTF-8 meta tag for proper encoding
		$wrapped_html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>' . $html . '</body></html>';
		$dom->loadHTML( $wrapped_html );
		libxml_clear_errors();

		$elements = [];
		
		// Get body element
		$body = $dom->getElementsByTagName( 'body' )->item( 0 );

		if ( $body && $body->hasChildNodes() ) {
			error_log( 'Body found with ' . $body->childNodes->length . ' child nodes' );
			
			foreach ( $body->childNodes as $node ) {
				error_log( 'Processing node type: ' . $node->nodeType . ', name: ' . $node->nodeName );
				
				if ( $node->nodeType === XML_ELEMENT_NODE ) {
					$element = $this->parse_node( $node );
					if ( $element ) {
						error_log( 'Created element: ' . $element['elType'] . ' (id: ' . $element['id'] . ')' );
						$elements[] = $element;
					} else {
						error_log( 'parse_node returned null for: ' . $node->nodeName );
					}
				}
			}
		} else {
			error_log( 'Body not found or empty' );
		}

		error_log( 'Total elements created: ' . count( $elements ) );

		return $elements;
	}

	/**
	 * Parse DOM node with smart detection using STYLE-BASED CLASSIFICATION
	 *
	 * @param \DOMNode $node DOM node.
	 * @return array|null Elementor element or null.
	 */
	private function parse_node( $node ) {
		$tag = strtolower( $node->nodeName );
		$styles = $this->parse_inline_styles( $node );
		$classes = $node->getAttribute( 'class' );

		// Classify element based on styles and structure
		$role = $this->detect_element_role( $node, $styles, $tag );

		error_log( "Element <{$tag}> classified as: {$role}" );

		// Route to appropriate creator based on role
		switch ( $role ) {
			case 'container':
				return $this->create_container_from_node( $node, $styles, $classes );
			
		case 'button':
			return $this->create_button( $node, $styles );
		
		case 'heading':
			return $this->create_heading( $node, strtolower( $node->nodeName ), $styles );			case 'image':
				return $this->create_image( $node, $styles );
			
			case 'list':
				return $this->create_icon_list( $node, $styles );
			
			case 'text':
			default:
				return $this->create_text_editor( $node, $styles );
		}
	}

	/**
	 * Detect element role based on HTML SEMANTICS (NOT styles!)
	 *
	 * @param \DOMNode $node
	 * @param array $styles
	 * @param string $tag
	 * @return string Role: container|button|heading|image|list|text
	 */
	private function detect_element_role( $node, $styles, $tag ) {
		// Rule 1: Semantic HTML tags (EXPLICIT)
		if ( $tag === 'img' ) {
			return 'image';
		}

		if ( in_array( $tag, [ 'ul', 'ol' ], true ) ) {
			return 'list';
		}

		if ( $tag === 'button' ) {
			return 'button';
		}

		if ( $tag === 'a' ) {
			return 'button'; // Links become buttons in Elementor
		}

		if ( in_array( $tag, [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ], true ) ) {
			return 'heading';
		}

		if ( $tag === 'p' ) {
			return 'text';
		}

		// Rule 2: Container detection (has child ELEMENTS)
		$children = $this->get_element_children( $node );
		
		if ( count( $children ) > 1 ) {
			// Multiple children = container
			return 'container';
		}

		if ( count( $children ) === 1 ) {
			// Single child - check if wrapper has significant styles
			if ( $this->has_significant_styles( $styles ) ) {
				return 'container'; // Wrapper with styles
			}
			// No significant styles - unwrap it in container logic
			return 'container';
		}

		// Rule 3: Leaf element (no children) = text
		return 'text';
	}

	/**
	 * Parse DIV intelligently
	 *
	 * @param \DOMNode $node
	 * @param array $styles
	 * @param string $classes
	 * @return array
	 */
	private function parse_div( $node, $styles, $classes ) {
		$children = $this->get_element_children( $node );

		// If DIV has only one child and no significant styling, unwrap it
		if ( count( $children ) === 1 && ! $this->has_significant_styles( $styles ) ) {
			return $this->parse_node( $children[0] );
		}

		// If DIV has text content only, create text widget
		if ( empty( $children ) || $this->is_text_only( $node ) ) {
			return $this->create_text_editor( $node, $styles );
		}

		// If DIV contains multiple children, create container
		return $this->create_container( $node, $styles, $classes );
	}

	/**
	 * Create Elementor container (Section + Column)
	 *
	 * @param \DOMNode $node
	 * @param array $styles
	 * @param string $classes
	 * @return array
	 */
	private function create_container( $node, $styles, $classes ) {
		$child_elements = [];

		foreach ( $node->childNodes as $child ) {
			if ( $child->nodeType === XML_ELEMENT_NODE ) {
				$element = $this->parse_node( $child );
				if ( $element ) {
					$child_elements[] = $element;
				}
			}
		}

		// Determine layout from styles
		$is_flex = isset( $styles['display'] ) && $styles['display'] === 'flex';
		$is_grid = isset( $styles['display'] ) && $styles['display'] === 'grid';
		$flex_direction = $styles['flex-direction'] ?? 'row';
		$is_row = $is_flex && $flex_direction === 'row';

		// If flex row OR grid with multiple children, create columns
		if ( ( $is_row || $is_grid ) && count( $child_elements ) > 1 ) {
			return $this->create_section_with_columns( $child_elements, $styles, $classes );
		}

		// Otherwise, create section with single column
		return $this->create_section_with_single_column( $child_elements, $styles, $classes );
	}

	/**
	 * Create section with multiple columns
	 *
	 * @param array $children
	 * @param array $styles
	 * @param string $classes
	 * @return array
	 */
	private function create_section_with_columns( $children, $styles, $classes ) {
		// Separate section vs column styles
		$section_styles = [];
		$column_styles = [];
		
		// These go to section
		$section_props = [ 'width', 'max-width', 'min-width' ];
		// These go to column
		$column_props = [ 'background-color', 'background', 'padding', 'border', 'border-radius', 'box-shadow', 'text-align' ];
		
		foreach ( $styles as $key => $value ) {
			if ( in_array( $key, $column_props, true ) ) {
				$column_styles[ $key ] = $value;
			} elseif ( in_array( $key, $section_props, true ) ) {
				$section_styles[ $key ] = $value;
			}
		}
		
		$columns = [];
		$column_count = count( $children );
		$column_size = floor( 100 / $column_count );

		foreach ( $children as $child ) {
			$columns[] = [
				'id'       => $this->generate_id(),
				'elType'   => 'column',
				'isInner'  => false,
				'isLocked' => false,
				'settings' => array_merge(
					[
						'_column_size' => $column_size,
						'_inline_size' => $column_size,
					],
					$this->convert_styles_to_column_settings( $column_styles )
				),
				'elements' => [ $child ],
			];
		}

		return [
			'id'       => $this->generate_id(),
			'elType'   => 'section',
			'isInner'  => false,
			'isLocked' => false,
			'settings' => $this->convert_styles_to_section_settings( $section_styles, $classes ),
			'elements' => $columns,
		];
	}

	/**
	 * Create section with single column
	 *
	 * @param array $children
	 * @param array $styles
	 * @param string $classes
	 * @return array
	 */
	private function create_section_with_single_column( $children, $styles, $classes ) {
		// Separate section vs column styles
		$section_styles = [];
		$column_styles = [];
		
		// These go to section
		$section_props = [ 'width', 'max-width', 'min-width' ];
		// These go to column
		$column_props = [ 'background-color', 'background', 'padding', 'border', 'border-radius', 'box-shadow', 'text-align' ];
		
		foreach ( $styles as $key => $value ) {
			if ( in_array( $key, $column_props, true ) ) {
				$column_styles[ $key ] = $value;
			} elseif ( in_array( $key, $section_props, true ) ) {
				$section_styles[ $key ] = $value;
			}
		}
		
		return [
			'id'       => $this->generate_id(),
			'elType'   => 'section',
			'isInner'  => false,
			'isLocked' => false,
			'settings' => $this->convert_styles_to_section_settings( $section_styles, $classes ),
			'elements' => [
				[
					'id'       => $this->generate_id(),
					'elType'   => 'column',
					'isInner'  => false,
					'isLocked' => false,
					'settings' => array_merge(
						[
							'_column_size' => 100,
							'_inline_size' => 100,
						],
						$this->convert_styles_to_column_settings( $column_styles )
					),
					'elements' => $children,
				],
			],
		];
	}

	/**
	 * Create heading widget
	 *
	 * @param \DOMNode $node
	 * @param string $tag
	 * @param array $styles
	 * @return array
	 */
	private function create_heading( $node, $tag, $styles ) {
		$text = trim( $node->textContent );

		return [
			'id'         => $this->generate_id(),
			'elType'     => 'widget',
			'isInner'    => false,
			'isLocked'   => false,
			'widgetType' => 'heading',
			'settings'   => array_merge(
				[
					'title'       => $text,
					'header_size' => $tag,
				],
				$this->convert_styles_to_heading_settings( $styles )
			),
		];
	}

	/**
	 * Create text editor widget
	 *
	 * @param \DOMNode $node
	 * @param array $styles
	 * @return array
	 */
	private function create_text_editor( $node, $styles ) {
		$html = $this->get_inner_html( $node );

		return [
			'id'         => $this->generate_id(),
			'elType'     => 'widget',
			'isInner'    => false,
			'isLocked'   => false,
			'widgetType' => 'text-editor',
			'settings'   => array_merge(
				[
					'editor' => $html,
				],
				$this->convert_styles_to_text_settings( $styles )
			),
		];
	}

	/**
	 * Create button widget
	 *
	 * @param \DOMNode $node
	 * @param array $styles
	 * @return array
	 */
	private function create_button( $node, $styles ) {
		$text = trim( $node->textContent );
		$href = $node->getAttribute( 'href' );

		return [
			'id'         => $this->generate_id(),
			'elType'     => 'widget',
			'isInner'    => false,
			'isLocked'   => false,
			'widgetType' => 'button',
			'settings'   => array_merge(
				[
					'text' => $text,
					'link' => [
						'url'         => $href,
						'is_external' => '',
						'nofollow'    => '',
					],
				],
				$this->convert_styles_to_button_settings( $styles )
			),
		];
	}

	/**
	 * Create image widget
	 *
	 * @param \DOMNode $node
	 * @param array $styles
	 * @return array
	 */
	private function create_image( $node, $styles ) {
		$src = $node->getAttribute( 'src' );
		$alt = $node->getAttribute( 'alt' );

		return [
			'id'         => $this->generate_id(),
			'elType'     => 'widget',
			'isInner'    => false,
			'isLocked'   => false,
			'widgetType' => 'image',
			'settings'   => array_merge(
				[
					'image' => [
						'url' => $src,
						'id'  => '',
					],
					'image_alt' => $alt,
				],
				$this->convert_styles_to_image_settings( $styles )
			),
		];
	}

	/**
	 * Create icon list widget
	 *
	 * @param \DOMNode $node
	 * @param array $styles
	 * @return array
	 */
	private function create_icon_list( $node, $styles ) {
		$items = [];

		foreach ( $node->childNodes as $li ) {
			if ( $li->nodeType === XML_ELEMENT_NODE && $li->nodeName === 'li' ) {
				$items[] = [
					'text' => trim( $li->textContent ),
					'_id'  => $this->generate_id(),
				];
			}
		}

		return [
			'id'         => $this->generate_id(),
			'elType'     => 'widget',
			'isInner'    => false,
			'isLocked'   => false,
			'widgetType' => 'icon-list',
			'settings'   => [
				'icon_list' => $items,
			],
		];
	}

	/**
	 * Parse inline styles to array
	 *
	 * @param \DOMNode $node
	 * @return array
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
	 * Convert CSS styles to Elementor section settings
	 *
	 * @param array $styles
	 * @param string $classes
	 * @return array
	 */
	private function convert_styles_to_section_settings( $styles, $classes ) {
		return $this->convert_styles_to_elementor( $styles, 'section' );
	}

	/**
	 * Convert CSS styles to Elementor column settings
	 *
	 * @param array $styles
	 * @return array
	 */
	private function convert_styles_to_column_settings( $styles ) {
		return $this->convert_styles_to_elementor( $styles, 'column' );
	}

	/**
	 * Convert CSS styles to heading widget settings
	 *
	 * @param array $styles
	 * @return array
	 */
	private function convert_styles_to_heading_settings( $styles ) {
		return $this->convert_styles_to_elementor( $styles, 'heading' );
	}

	/**
	 * Convert CSS styles to text editor settings
	 *
	 * @param array $styles
	 * @return array
	 */
	private function convert_styles_to_text_settings( $styles ) {
		return $this->convert_styles_to_elementor( $styles, 'text' );
	}

	/**
	 * Convert CSS styles to button widget settings
	 *
	 * @param array $styles
	 * @return array
	 */
	private function convert_styles_to_button_settings( $styles ) {
		return $this->convert_styles_to_elementor( $styles, 'button' );
	}

	/**
	 * Convert CSS styles to image widget settings
	 *
	 * @param array $styles
	 * @return array
	 */
	private function convert_styles_to_image_settings( $styles ) {
		return $this->convert_styles_to_elementor( $styles, 'image' );
	}

	/**
	 * Parse spacing value (padding, margin, etc.)
	 *
	 * @param string $value
	 * @return array
	 */
	private function parse_spacing( $value ) {
		$parts = preg_split( '/\s+/', trim( $value ) );
		$count = count( $parts );

		$top = $right = $bottom = $left = '';

		if ( $count === 1 ) {
			$top = $right = $bottom = $left = $parts[0];
		} elseif ( $count === 2 ) {
			$top = $bottom = $parts[0];
			$right = $left = $parts[1];
		} elseif ( $count === 3 ) {
			$top = $parts[0];
			$right = $left = $parts[1];
			$bottom = $parts[2];
		} elseif ( $count >= 4 ) {
			$top = $parts[0];
			$right = $parts[1];
			$bottom = $parts[2];
			$left = $parts[3];
		}

		return [
			'top'    => $this->strip_unit( $top ),
			'right'  => $this->strip_unit( $right ),
			'bottom' => $this->strip_unit( $bottom ),
			'left'   => $this->strip_unit( $left ),
			'unit'   => $this->extract_unit( $top ),
		];
	}

	/**
	 * Parse unit value (e.g., "100px" -> ["size" => 100, "unit" => "px"])
	 * Supports unitless values like line-height: 1.6
	 *
	 * @param string $value
	 * @return array
	 */
	private function parse_unit_value( $value ) {
		$value = trim( $value );
		
		// Match number with optional unit
		preg_match( '/^([\d.]+)(.*)$/', $value, $matches );

		$size = ! empty( $matches[1] ) ? floatval( $matches[1] ) : '';
		$unit = ! empty( $matches[2] ) ? trim( $matches[2] ) : '';
		
		// If no unit specified, use empty string (unitless - for line-height, etc.)
		// Elementor uses empty string for unitless values
		if ( empty( $unit ) ) {
			$unit = '';
		}

		return [
			'size' => $size,
			'unit' => $unit,
		];
	}

	/**
	 * Strip unit from value
	 *
	 * @param string $value
	 * @return string
	 */
	private function strip_unit( $value ) {
		return preg_replace( '/[^0-9.]/', '', $value );
	}

	/**
	 * Extract unit from value
	 *
	 * @param string $value
	 * @return string
	 */
	private function extract_unit( $value ) {
		preg_match( '/[a-z%]+$/i', trim( $value ), $matches );
		return ! empty( $matches[0] ) ? $matches[0] : 'px';
	}

	/**
	 * Parse border width
	 *
	 * @param string $border
	 * @return array
	 */
	private function parse_border_width( $border ) {
		// border: 1px solid #ddd
		preg_match( '/^([\d.]+px)/', $border, $matches );
		$width = ! empty( $matches[1] ) ? $this->strip_unit( $matches[1] ) : '1';

		return [
			'top'    => $width,
			'right'  => $width,
			'bottom' => $width,
			'left'   => $width,
			'unit'   => 'px',
		];
	}

	/**
	 * Parse border color
	 *
	 * @param string $border
	 * @return string
	 */
	private function parse_border_color( $border ) {
		// border: 1px solid #ddd
		preg_match( '/#[0-9a-f]{3,6}/i', $border, $matches );
		return ! empty( $matches[0] ) ? $matches[0] : '';
	}

	/**
	 * Parse box shadow
	 *
	 * @param string $shadow
	 * @return array
	 */
	private function parse_box_shadow( $shadow ) {
		// box-shadow: 0 2px 4px rgba(0,0,0,0.1)
		preg_match( '/(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(.+)/', $shadow, $matches );

		if ( ! empty( $matches ) ) {
			return [
				'horizontal' => intval( $matches[1] ),
				'vertical'   => intval( $matches[2] ),
				'blur'       => intval( $matches[3] ),
				'spread'     => intval( $matches[4] ),
				'color'      => $matches[5],
			];
		}

		// Simpler format: 0 2px 4px rgba(0,0,0,0.1)
		preg_match( '/(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(.+)/', $shadow, $matches );

		if ( ! empty( $matches ) ) {
			return [
				'horizontal' => intval( $matches[1] ),
				'vertical'   => intval( $matches[2] ),
				'blur'       => intval( $matches[3] ),
				'spread'     => 0,
				'color'      => $matches[4],
			];
		}

		return [];
	}

	/**
	 * Check if link should be button
	 *
	 * @param \DOMNode $node
	 * @param array $styles
	 * @return bool
	 */
	private function is_button_link( $node, $styles ) {
		// All <a> tags are buttons in Elementor
		return true;
	}

	/**
	 * Check if styles indicate a layout container
	 * 
	 * @param array $styles
	 * @return bool
	 */
	private function has_layout_styles( $styles ) {
		// Check if has flex or grid layout
		if ( isset( $styles['display'] ) ) {
			$display = $styles['display'];
			return in_array( $display, [ 'flex', 'inline-flex', 'grid', 'inline-grid' ], true );
		}

		// Has grid/flex specific properties
		if ( isset( $styles['grid-template-columns'] ) || isset( $styles['flex-direction'] ) || isset( $styles['gap'] ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Wrapper for container creation (replaces parse_div)
	 * 
	 * @param \DOMNode $node
	 * @param array $styles
	 * @param string $classes
	 * @return array
	 */
	private function create_container_from_node( $node, $styles, $classes ) {
		// Use existing create_container logic
		return $this->create_container( $node, $styles, $classes );
	}

	/**
	 * Check if DIV has significant styles
	 *
	 * @param array $styles
	 * @return bool
	 */
	private function has_significant_styles( $styles ) {
		// Properties that make a container significant enough to preserve
		$significant_props = [
			// Background & Visual
			'background-color',
			'background',
			'background-image',
			'background-gradient',
			
			// Spacing
			'padding',
			'padding-top',
			'padding-right',
			'padding-bottom',
			'padding-left',
			'margin',
			'margin-top',
			'margin-right',
			'margin-bottom',
			'margin-left',
			
			// Layout
			'display',
			'flex-direction',
			'justify-content',
			'align-items',
			'gap',
			'grid-template-columns',
			
			// Dimensions
			'width',
			'min-width',
			'max-width',
			'height',
			'min-height',
			'max-height',
			
			// Border
			'border',
			'border-radius',
			'box-shadow',
			
			// Position
			'position',
			'top',
			'right',
			'bottom',
			'left',
		];

		foreach ( $significant_props as $prop ) {
			if ( isset( $styles[ $prop ] ) && ! empty( $styles[ $prop ] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if node contains only text
	 *
	 * @param \DOMNode $node
	 * @return bool
	 */
	private function is_text_only( $node ) {
		foreach ( $node->childNodes as $child ) {
			if ( $child->nodeType === XML_ELEMENT_NODE ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Get element children (excluding text nodes)
	 *
	 * @param \DOMNode $node
	 * @return array
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
	 *
	 * @param \DOMNode $node
	 * @return string
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
	 *
	 * @return string
	 */
	private function generate_id() {
		return substr( md5( uniqid( '', true ) ), 0, 7 );
	}

	/**
	 * Universal CSS to Elementor settings converter
	 * 
	 * @param array $styles CSS styles
	 * @param string $element_type Element type (text, heading, button, section, column, image)
	 * @return array Elementor settings
	 */
	private function convert_styles_to_elementor( $styles, $element_type = 'text' ) {
		$settings = [];

		// ========================================
		// BACKGROUND COLOR - Special handling per element type
		// ========================================
		if ( isset( $styles['background-color'] ) || isset( $styles['background'] ) ) {
			$bg_color = $styles['background-color'] ?? $styles['background'] ?? '';
			
			if ( $element_type === 'section' ) {
				// Section uses _background_ prefix
				$settings['_background_background'] = 'classic';
				$settings['_background_color'] = $bg_color;
			} elseif ( $element_type === 'column' ) {
				// Column uses background_ prefix (no underscore)
				$settings['background_background'] = 'classic';
				$settings['background_color'] = $bg_color;
			} elseif ( $element_type === 'button' ) {
				// Button uses button_ prefix
				$settings['button_background_color'] = $bg_color;
			} else {
				// Widgets (text, heading, image) use _background_ prefix
				$settings['_background_background'] = 'classic';
				$settings['_background_color'] = $bg_color;
			}
		}

		// ========================================
		// TEXT COLOR - Element-specific field names
		// ========================================
		if ( isset( $styles['color'] ) ) {
			$color_field = 'text_color'; // Default for text widget
			
			if ( $element_type === 'heading' ) {
				$color_field = 'title_color';
			} elseif ( $element_type === 'button' ) {
				$color_field = 'button_text_color';
			}
			
			$settings[ $color_field ] = $styles['color'];
		}

		// ========================================
		// PADDING - Universal (prefix depends on element type)
		// ========================================
		if ( isset( $styles['padding'] ) ) {
			$padding = $this->parse_spacing_with_linked( $styles['padding'] );
			
			if ( $element_type === 'button' ) {
				$settings['button_padding'] = $padding;
			} elseif ( $element_type === 'section' || $element_type === 'column' ) {
				// Section/Column use 'padding' (no prefix)
				$settings['padding'] = $padding;
			} else {
				// Widgets use '_padding'
				$settings['_padding'] = $padding;
			}
		}

		// ========================================
		// MARGIN - Universal (with special handling for "auto")
		// ========================================
		if ( isset( $styles['margin'] ) ) {
			// Check if margin is "auto" (centering)
			if ( trim( $styles['margin'] ) === 'auto' ) {
				// For section/column, "margin: auto" means centered layout
				if ( $element_type === 'section' ) {
					$settings['content_width'] = 'full'; // Full width but centered content
				}
			} else {
				$settings['_margin'] = $this->parse_spacing_with_linked( $styles['margin'] );
			}
		}

		// Margin individual sides
		if ( isset( $styles['margin-top'] ) || isset( $styles['margin-right'] ) || isset( $styles['margin-bottom'] ) || isset( $styles['margin-left'] ) ) {
			$margin = isset( $settings['_margin'] ) ? $settings['_margin'] : [ 'top' => '', 'right' => '', 'bottom' => '', 'left' => '', 'unit' => 'px', 'isLinked' => false ];
			if ( isset( $styles['margin-top'] ) ) {
				$margin['top'] = $this->strip_unit( $styles['margin-top'] );
				$margin['unit'] = $this->extract_unit( $styles['margin-top'] );
			}
			if ( isset( $styles['margin-right'] ) ) {
				$margin['right'] = $this->strip_unit( $styles['margin-right'] );
			}
			if ( isset( $styles['margin-bottom'] ) ) {
				$margin['bottom'] = $this->strip_unit( $styles['margin-bottom'] );
			}
			if ( isset( $styles['margin-left'] ) ) {
				$margin['left'] = $this->strip_unit( $styles['margin-left'] );
			}
			$settings['_margin'] = $margin;
		}

		// ========================================
		// BORDER RADIUS
		// ========================================
		if ( isset( $styles['border-radius'] ) ) {
			$border_radius = $this->parse_spacing_with_linked( $styles['border-radius'] );
			
			if ( $element_type === 'button' ) {
				$settings['button_border_radius'] = $border_radius;
			} elseif ( $element_type === 'section' || $element_type === 'column' ) {
				$settings['border_radius'] = $border_radius;
			} else {
				$settings['_border_radius'] = $border_radius;
			}
		}

		// ========================================
		// BORDER
		// ========================================
		if ( isset( $styles['border'] ) ) {
			$prefix = ( $element_type === 'section' || $element_type === 'column' ) ? '' : '_';
			
			$settings["{$prefix}border_border"] = 'solid';
			$settings["{$prefix}border_width"] = $this->parse_border_width_with_linked( $styles['border'] );
			
			$border_color = $this->parse_border_color( $styles['border'] );
			if ( $border_color ) {
				$settings["{$prefix}border_color"] = $border_color;
			}
		}

		// ========================================
		// TYPOGRAPHY - Universal mapping with formula
		// ========================================
		$typography_map = [
			// CSS property => [Elementor field, needs_parsing, custom_processor]
			'font-size'       => [ 'typography_font_size', true, null ],
			'font-weight'     => [ 'typography_font_weight', false, null ],
			'text-decoration' => [ 'typography_text_decoration', false, null ],
			'line-height'     => [ 'typography_line_height', true, null ],
			'letter-spacing'  => [ 'typography_letter_spacing', true, null ],
			'font-family'     => [ 'typography_font_family', false, 'trim_quotes' ],
			'text-transform'  => [ 'typography_text_transform', false, null ],
			'font-style'      => [ 'typography_font_style', false, null ],
			'word-spacing'    => [ 'typography_word_spacing', true, null ],
		];

		$has_typography = false;
		foreach ( $typography_map as $css_prop => $config ) {
			if ( isset( $styles[ $css_prop ] ) ) {
				list( $elementor_field, $needs_parsing, $processor ) = $config;
				
				// Apply value transformation
				if ( $needs_parsing ) {
					$settings[ $elementor_field ] = $this->parse_unit_value( $styles[ $css_prop ] );
				} elseif ( $processor === 'trim_quotes' ) {
					$settings[ $elementor_field ] = trim( $styles[ $css_prop ], '\'"' );
				} else {
					$settings[ $elementor_field ] = $styles[ $css_prop ];
				}
				
				$has_typography = true;
			}
		}

		// CRITICAL: Enable custom typography if any typography property is set
		if ( $has_typography ) {
			$settings['typography_typography'] = 'custom';
		}

		// ========================================
		// BOX SHADOW
		// ========================================
		if ( isset( $styles['box-shadow'] ) ) {
			$prefix = ( $element_type === 'section' || $element_type === 'column' ) ? '' : '_';
			
			$settings["{$prefix}box_shadow_box_shadow_type"] = 'yes';
			$settings["{$prefix}box_shadow_box_shadow"] = $this->parse_box_shadow( $styles['box-shadow'] );
		}

		// ========================================
		// TEXT ALIGN
		// ========================================
		if ( isset( $styles['text-align'] ) ) {
			if ( $element_type === 'column' ) {
				// Column uses 'content_position' for text-align
				$settings['content_position'] = $styles['text-align'];
			} else {
				// Widgets use 'align'
				$settings['align'] = $styles['text-align'];
			}
		}

		// ========================================
		// DIMENSIONS (Width, Height)
		// ========================================
		if ( isset( $styles['width'] ) ) {
			if ( $element_type === 'section' || $element_type === 'column' || $element_type === 'image' ) {
				$settings['width'] = $this->parse_unit_value( $styles['width'] );
			} else {
				$settings['_width'] = $this->parse_unit_value( $styles['width'] );
			}
		}

		if ( isset( $styles['max-width'] ) ) {
			if ( $element_type === 'section' || $element_type === 'image' ) {
				$settings['max_width'] = $this->parse_unit_value( $styles['max-width'] );
			} else {
				$settings['_max_width'] = $this->parse_unit_value( $styles['max-width'] );
			}
		}

		if ( isset( $styles['min-width'] ) ) {
			$settings['_min_width'] = $this->parse_unit_value( $styles['min-width'] );
		}

		if ( isset( $styles['height'] ) ) {
			$settings['_height'] = $this->parse_unit_value( $styles['height'] );
		}

		if ( isset( $styles['max-height'] ) ) {
			$settings['_max_height'] = $this->parse_unit_value( $styles['max-height'] );
		}

		if ( isset( $styles['min-height'] ) ) {
			if ( $element_type === 'section' ) {
				$settings['min_height'] = $this->parse_unit_value( $styles['min-height'] );
			} else {
				$settings['_min_height'] = $this->parse_unit_value( $styles['min-height'] );
			}
		}

		// ========================================
		// GAP (for flex/grid containers)
		// ========================================
		if ( isset( $styles['gap'] ) ) {
			if ( $element_type === 'section' ) {
				// Parse gap value (can be single value or two values)
				$gap_parts = preg_split( '/\s+/', trim( $styles['gap'] ) );
				if ( count( $gap_parts ) === 1 ) {
					// Single value applies to both row and column gap
					$settings['gap'] = [
						'column' => $this->strip_unit( $gap_parts[0] ),
						'row' => $this->strip_unit( $gap_parts[0] ),
						'unit' => $this->extract_unit( $gap_parts[0] ),
					];
				} else {
					// Two values: row gap, column gap
					$settings['gap'] = [
						'row' => $this->strip_unit( $gap_parts[0] ),
						'column' => $this->strip_unit( $gap_parts[1] ),
						'unit' => $this->extract_unit( $gap_parts[0] ),
					];
				}
			}
		}

		// ========================================
		// GRID LAYOUT PROPERTIES
		// ========================================
		if ( isset( $styles['grid-template-columns'] ) && $element_type === 'section' ) {
			// Store grid config for reference (Elementor handles columns differently)
			// This is informational - actual columns are created by create_section_with_columns()
			$settings['__grid_template_columns'] = $styles['grid-template-columns'];
		}

		if ( isset( $styles['grid-template-rows'] ) && $element_type === 'section' ) {
			$settings['__grid_template_rows'] = $styles['grid-template-rows'];
		}

		// ========================================
		// FLEX LAYOUT PROPERTIES
		// ========================================
		if ( isset( $styles['flex-direction'] ) && $element_type === 'section' ) {
			$settings['flex_direction'] = $styles['flex-direction'];
		}

		if ( isset( $styles['justify-content'] ) && $element_type === 'section' ) {
			$settings['justify_content'] = $styles['justify-content'];
		}

		if ( isset( $styles['align-items'] ) && $element_type === 'section' ) {
			$settings['align_items'] = $styles['align-items'];
		}

		if ( isset( $styles['flex-wrap'] ) && $element_type === 'section' ) {
			$settings['flex_wrap'] = $styles['flex-wrap'];
		}

		// ========================================
		// DISPLAY - Element width behavior
		// ========================================
		if ( isset( $styles['display'] ) ) {
			if ( $element_type === 'button' && $styles['display'] === 'block' ) {
				$settings['button_width'] = 'full';
			} elseif ( $element_type !== 'section' && $element_type !== 'column' ) {
				if ( $styles['display'] === 'block' ) {
					$settings['_element_width'] = 'auto';
				} elseif ( in_array( $styles['display'], [ 'inline-block', 'inline-flex' ], true ) ) {
					$settings['_element_width'] = 'initial';
				}
			}
		}

		// ========================================
		// OPACITY
		// ========================================
		if ( isset( $styles['opacity'] ) ) {
			$settings['_opacity'] = floatval( $styles['opacity'] );
		}

		// ========================================
		// Z-INDEX
		// ========================================
		if ( isset( $styles['z-index'] ) ) {
			$settings['_z_index'] = intval( $styles['z-index'] );
		}

		// ========================================
		// CURSOR - Interactive behavior
		// ========================================
		if ( isset( $styles['cursor'] ) && $styles['cursor'] === 'pointer' ) {
			$settings['hover_animation'] = 'grow';
		}

		// ========================================
		// POSITION
		// ========================================
		if ( isset( $styles['position'] ) ) {
			$settings['_position'] = $styles['position'];
			
			// Position offsets
			if ( isset( $styles['top'] ) ) {
				$settings['_offset_y'] = $this->parse_unit_value( $styles['top'] );
			}
			if ( isset( $styles['left'] ) ) {
				$settings['_offset_x'] = $this->parse_unit_value( $styles['left'] );
			}
		}

		// ========================================
		// BUTTON-SPECIFIC: Auto-center alignment
		// ========================================
		if ( $element_type === 'button' && isset( $styles['margin'] ) && strpos( $styles['margin'], 'auto' ) !== false ) {
			$settings['align'] = 'center';
		}

		return $settings;
	}

	/**
	 * Parse spacing with isLinked flag
	 * 
	 * @param string $value
	 * @return array
	 */
	private function parse_spacing_with_linked( $value ) {
		$spacing = $this->parse_spacing( $value );
		
		// Check if all sides are equal (linked)
		$is_linked = ( 
			$spacing['top'] === $spacing['right'] && 
			$spacing['right'] === $spacing['bottom'] && 
			$spacing['bottom'] === $spacing['left'] 
		);
		
		$spacing['isLinked'] = $is_linked;
		
		return $spacing;
	}

	/**
	 * Parse border width with isLinked flag
	 * 
	 * @param string $border
	 * @return array
	 */
	private function parse_border_width_with_linked( $border ) {
		$width = $this->parse_border_width( $border );
		$width['isLinked'] = true; // Border usually linked
		return $width;
	}
}
