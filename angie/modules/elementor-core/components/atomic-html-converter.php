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
		// Skip comment nodes
		if ( $node->nodeType === XML_COMMENT_NODE ) {
			return null;
		}
		
		// Skip text nodes
		if ( $node->nodeType === XML_TEXT_NODE ) {
			return null;
		}
		
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

		// Inline text elements - always treat as text, never container
		if ( in_array( $tag, [ 'span', 'em', 'strong', 'b', 'i', 'u', 'mark', 'small', 'sub', 'sup' ], true ) ) {
			return 'text';
		}

		// Check if element has children
		$children = $this->get_element_children( $node );
		if ( count( $children ) > 0 ) {
			// Check if all children are inline formatting elements
			$inline_tags = [ 'br', 'span', 'em', 'strong', 'b', 'i', 'u', 'mark', 'small', 'sub', 'sup', 'a' ];
			$all_inline = true;
			
			foreach ( $children as $child ) {
				$child_tag = strtolower( $child->nodeName );
				if ( ! in_array( $child_tag, $inline_tags, true ) ) {
					$all_inline = false;
					break;
				}
			}
			
			// If all children are inline, treat as text (preserve innerHTML)
			if ( $all_inline ) {
				return 'text';
			}
			
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
		$settings = [
			'text' => [
				'$$type' => 'string',
				'value'  => trim( $node->textContent ),
			],
		];
		
		// Only add link if href exists (for <a> tags)
		$href = $node->getAttribute( 'href' );
		if ( ! empty( $href ) ) {
			$settings['link'] = [
				'$$type' => 'link',
				'value'  => [
					'url'         => $href,
					'is_external' => '',
					'nofollow'    => '',
				],
			];
		}
		
		return $this->create_atomic_widget( 'e-button', $node, $styles, $settings );
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

		// Post-process: Group individual padding/margin properties into dimensions
		$props = $this->group_individual_properties( $props );
		
		// Post-process: Merge background properties (size, position, repeat, attachment)
		$props = $this->merge_background_properties( $props, $css_styles );

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
	 * Group individual padding/margin properties into dimensions
	 * Auto-fills missing sides with 0
	 * 
	 * @param array $props Atomic props array.
	 * @return array Modified props with grouped dimensions.
	 */
	private function group_individual_properties( $props ) {
		// Auto-fill missing padding sides with 0
		$padding_sides = [ 'padding-top', 'padding-right', 'padding-bottom', 'padding-left' ];
		$has_any_padding = false;
		foreach ( $padding_sides as $side ) {
			if ( isset( $props[ $side ] ) ) {
				$has_any_padding = true;
				break;
			}
		}

		// If we have at least one padding side, fill missing ones with 0
		if ( $has_any_padding ) {
			$zero_value = [
				'$$type' => 'size',
				'value'  => [ 'size' => 0, 'unit' => 'px' ],
			];

			foreach ( $padding_sides as $side ) {
				if ( ! isset( $props[ $side ] ) ) {
					$props[ $side ] = $zero_value;
				}
			}

			// Now group padding into dimensions with logical properties
			$logical_map = [
				'padding-top'    => 'block-start',
				'padding-bottom' => 'block-end',
				'padding-left'   => 'inline-start',
				'padding-right'  => 'inline-end',
			];

			$dimension_values = [];
			foreach ( $padding_sides as $side ) {
				$logical_side = $logical_map[ $side ];
				$dimension_values[ $logical_side ] = $props[ $side ];
				unset( $props[ $side ] ); // Remove individual property
			}

			$props['padding'] = [
				'$$type' => 'dimensions',
				'value'  => $dimension_values,
			];
		}

		// Auto-fill missing margin sides with 0
		$margin_sides = [ 'margin-top', 'margin-right', 'margin-bottom', 'margin-left' ];
		$has_any_margin = false;
		foreach ( $margin_sides as $side ) {
			if ( isset( $props[ $side ] ) ) {
				$has_any_margin = true;
				break;
			}
		}

		// If we have at least one margin side, fill missing ones with 0
		if ( $has_any_margin ) {
			$zero_value = [
				'$$type' => 'size',
				'value'  => [ 'size' => 0, 'unit' => 'px' ],
			];

			foreach ( $margin_sides as $side ) {
				if ( ! isset( $props[ $side ] ) ) {
					$props[ $side ] = $zero_value;
				}
			}

			// Now group margin into dimensions with logical properties
			$logical_map = [
				'margin-top'    => 'block-start',
				'margin-bottom' => 'block-end',
				'margin-left'   => 'inline-start',
				'margin-right'  => 'inline-end',
			];

			$dimension_values = [];
			foreach ( $margin_sides as $side ) {
				$logical_side = $logical_map[ $side ];
				$dimension_values[ $logical_side ] = $props[ $side ];
				unset( $props[ $side ] ); // Remove individual property
			}

			$props['margin'] = [
				'$$type' => 'dimensions',
				'value'  => $dimension_values,
			];
		}

		return $props;
	}

	/**
	 * Merge background properties (size, position, repeat, attachment) into background overlay
	 * 
	 * @param array $props Atomic props array.
	 * @param array $css_styles Original CSS styles.
	 * @return array Modified props with merged background.
	 */
	private function merge_background_properties( $props, $css_styles ) {
		// Only process if background exists and is an image overlay
		if ( ! isset( $props['background'] ) ) {
			return $props;
		}
		
		$background = $props['background'];
		
		// Check if it's a background-image-overlay
		if ( ! isset( $background['value']['background-overlay']['value'][0]['$$type'] ) ||
		     $background['value']['background-overlay']['value'][0]['$$type'] !== 'background-image-overlay' ) {
			return $props;
		}
		
		// Get reference to image overlay value
		$overlay = &$background['value']['background-overlay']['value'][0]['value'];
		
		// Merge background-size
		if ( isset( $css_styles['background-size'] ) ) {
			$overlay['size'] = [
				'$$type' => 'string',
				'value'  => $css_styles['background-size'],
			];
		}
		
		// Merge background-position
		if ( isset( $css_styles['background-position'] ) ) {
			$position = $css_styles['background-position'];
			
			// Normalize single value to "horizontal vertical" format
			// "center" → "center center"
			// "top" → "center top"
			// "left" → "left center"
			if ( ! preg_match( '/\s/', $position ) ) {
				// Single value
				if ( $position === 'center' ) {
					$position = 'center center';
				} elseif ( in_array( $position, [ 'top', 'bottom' ], true ) ) {
					$position = 'center ' . $position;
				} elseif ( in_array( $position, [ 'left', 'right' ], true ) ) {
					$position = $position . ' center';
				}
			}
			
			$overlay['position'] = [
				'$$type' => 'string',
				'value'  => $position,
			];
		}
		
		// Merge background-repeat
		if ( isset( $css_styles['background-repeat'] ) ) {
			$overlay['repeat'] = [
				'$$type' => 'string',
				'value'  => $css_styles['background-repeat'],
			];
		}
		
		// Merge background-attachment
		if ( isset( $css_styles['background-attachment'] ) ) {
			$overlay['attachment'] = [
				'$$type' => 'string',
				'value'  => $css_styles['background-attachment'],
			];
		}
		
		// Update props with merged background
		$props['background'] = $background;
		
		return $props;
	}

	/**
	 * Convert CSS property to Atomic typed prop
	 *
	 * @param string $property CSS property name.
	 * @param string $value CSS value.
	 * @return array|null Atomic prop or null.
	 */
	private function css_to_atomic_prop( $property, $value ) {
		// Skip background helper properties - they will be merged into background later
		$skip_props = [ 'background-size', 'background-position', 'background-repeat', 'background-attachment' ];
		if ( in_array( $property, $skip_props, true ) ) {
			return null;
		}
		
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

		// Background-image with url()
		if ( $property === 'background-image' ) {
			// Extract URL from url('...')
			if ( preg_match( '/url\([\'"]?([^\'"]+)[\'"]?\)/i', $value, $matches ) ) {
				$image_url = $matches[1];
				
				// Upload image to WordPress and get attachment ID
				$attachment_id = $this->upload_image_from_url( $image_url );
				
				if ( $attachment_id ) {
					return [
						'name'  => 'background',
						'value' => [
							'$$type' => 'background',
							'value'  => [
								'color' => [
									'$$type' => 'color',
									'value'  => 'transparent', // Transparent background, image shows through
								],
								'background-overlay' => [
									'$$type' => 'background-overlay',
									'value'  => [
										[
											'$$type' => 'background-image-overlay',
											'value'  => [
												'image' => [
													'$$type' => 'image',
													'value'  => [
														'src' => [
															'$$type' => 'image-src',
															'value'  => [
																'id' => [
																	'$$type' => 'image-attachment-id',
																	'value'  => $attachment_id,
																],
																'url' => null,
															],
														],
														'size' => [
															'$$type' => 'string',
															'value'  => 'large',
														],
													],
												],
												'position' => [
													'$$type' => 'string',
													'value'  => 'center center', // Will be overridden by background-position if present
												],
												'repeat' => [
													'$$type' => 'string',
													'value'  => 'no-repeat', // Default for images
												],
												'size' => [
													'$$type' => 'string',
													'value'  => 'cover', // Will be overridden by background-size if present
												],
												'attachment' => [
													'$$type' => 'string',
													'value'  => 'scroll', // Default, can be 'fixed' or 'scroll'
												],
											],
										],
									],
								],
							],
						],
					];
				} else {
					error_log( "Failed to upload background image: $image_url" );
					return null;
				}
			}
			
			return null;
		}

		// Background-color or background shorthand
		if ( $property === 'background-color' || $property === 'background' ) {
			// Check if it's a gradient
			if ( strpos( $value, 'gradient' ) !== false ) {
				$gradient = $this->parse_gradient( $value );
				if ( $gradient ) {
					return [
						'name'  => 'background',
						'value' => [
							'$$type' => 'background',
							'value'  => [
								'color' => [
									'$$type' => 'color',
									'value'  => 'transparent',
								],
								'background-overlay' => [
									'$$type' => 'background-overlay',
									'value'  => [
										[
											'$$type' => 'background-gradient-overlay',
											'value'  => $gradient,
										],
									],
								],
							],
						],
					];
				} else {
					error_log( "Gradient format not recognized, skipping: $value" );
					return null;
				}
			}
			
			// Simple solid color background
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
			// Pass property name to parse_size_value for unitless detection (e.g., line-height)
			$parsed = $this->parse_size_value( $value, $property );
			return [
				'name'  => $property,
				'value' => [
					'$$type' => 'size',
					'value'  => $parsed,
				],
			];
		}

		// Line-height special handling - unitless values default to 'em'
		if ( $property === 'line-height' ) {
			$parsed = $this->parse_size_value( $value, $property );
			
			// If unitless, default to 'em' unit
			if ( empty( $parsed['unit'] ) ) {
				$parsed['unit'] = 'em';
			}
			
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

		// Box-shadow - parse basic format: "h-offset v-offset blur spread color"
		if ( $property === 'box-shadow' && $value !== 'none' ) {
			// Parse: "0 4px 15px rgba(0,0,0,0.2)" or "0 4px 15px 0 rgba(0,0,0,0.2)"
			// Split by spaces, but keep rgba() together
			$value = trim( $value );
			
			// Extract color (rgba/rgb/hex at end)
			$color = 'rgba(0, 0, 0, 1)';
			if ( preg_match( '/(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})$/', $value, $colorMatch ) ) {
				$color = $colorMatch[1];
				$value = trim( str_replace( $colorMatch[0], '', $value ) );
			}
			
			// Parse remaining values (h-offset v-offset blur spread)
			$parts = preg_split( '/\s+/', $value );
			
			if ( count( $parts ) >= 2 ) {
				return [
					'name'  => 'box-shadow',
					'value' => [
						'$$type' => 'box-shadow',
						'value'  => [
							[
								'$$type' => 'shadow',
								'value'  => [
									'hOffset' => [
										'$$type' => 'size',
										'value'  => $this->parse_size_value( $parts[0] ),
									],
									'vOffset' => [
										'$$type' => 'size',
										'value'  => $this->parse_size_value( $parts[1] ),
									],
									'blur' => [
										'$$type' => 'size',
										'value'  => isset( $parts[2] ) ? $this->parse_size_value( $parts[2] ) : [ 'size' => 0, 'unit' => 'px' ],
									],
									'spread' => [
										'$$type' => 'size',
										'value'  => isset( $parts[3] ) ? $this->parse_size_value( $parts[3] ) : [ 'size' => 0, 'unit' => 'px' ],
									],
									'color' => [
										'$$type' => 'color',
										'value'  => $color,
									],
									'position' => null,
								],
							],
						],
					],
				];
			} else {
				error_log( "Box-shadow format not recognized: $value" );
				return null;
			}
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
	 * Supports: px, em, rem, %, vh, vw, auto, unitless (for line-height)
	 * 
	 * @param string $value CSS value to parse
	 * @param string $property Property name (optional, for unitless detection)
	 */
	private function parse_size_value( $value, $property = '' ) {
		$value = trim( $value );
		
		// Handle 'auto' value
		if ( $value === 'auto' ) {
			return [
				'size' => 0,
				'unit' => 'auto',
			];
		}
		
		// Handle numeric values with units
		preg_match( '/^([\d.]+)(.*)$/', $value, $matches );
		
		$size = ! empty( $matches[1] ) ? floatval( $matches[1] ) : 0;
		$unit = ! empty( $matches[2] ) ? trim( $matches[2] ) : '';
		
		// If no unit provided, check if property should be unitless
		if ( empty( $unit ) ) {
			// line-height, z-index, opacity, flex-grow, flex-shrink should be unitless
			$unitless_props = [ 'line-height', 'z-index', 'opacity', 'flex-grow', 'flex-shrink', 'order' ];
			if ( in_array( $property, $unitless_props, true ) ) {
				$unit = ''; // Keep empty for unitless
			} else {
				$unit = 'px'; // Default to px for other properties
			}
		}

		return [
			'size' => $size,
			'unit' => $unit,
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
	 * Parse CSS gradient to Elementor v4 format
	 * Supports: linear-gradient(angle, color stop%, color stop%)
	 * 
	 * @param string $gradient_string CSS gradient string
	 * @return array|null Gradient object or null
	 */
	private function parse_gradient( $gradient_string ) {
		// Match linear-gradient(135deg, #667eea 0%, #764ba2 100%)
		if ( ! preg_match( '/linear-gradient\s*\(\s*([^,]+),\s*(.+)\s*\)/', $gradient_string, $matches ) ) {
			return null;
		}
		
		$angle_str = trim( $matches[1] );
		$stops_str = trim( $matches[2] );
		
		// Parse angle (135deg → 135)
		$angle = 0;
		if ( preg_match( '/(\d+)deg/', $angle_str, $angle_match ) ) {
			$angle = intval( $angle_match[1] );
		}
		
		// Parse color stops: "#667eea 0%, #764ba2 100%"
		// Split by comma, but preserve rgba()
		$stops_parts = preg_split( '/,(?![^(]*\))/', $stops_str );
		$stops = [];
		
		foreach ( $stops_parts as $stop_str ) {
			$stop_str = trim( $stop_str );
			
			// Match: "rgba(0,0,0,1) 0%" or "#667eea 50%" or "white"
			if ( preg_match( '/^(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|\w+)\s*(\d+)?%?\s*$/', $stop_str, $stop_match ) ) {
				$color = $stop_match[1];
				$offset = isset( $stop_match[2] ) ? intval( $stop_match[2] ) : ( count( $stops ) === 0 ? 0 : 100 );
				
				$stops[] = [
					'$$type' => 'color-stop',
					'value'  => [
						'color' => [
							'$$type' => 'color',
							'value'  => $color,
						],
						'offset' => [
							'$$type' => 'number',
							'value'  => $offset,
						],
					],
				];
			}
		}
		
		// Need at least 2 stops
		if ( count( $stops ) < 2 ) {
			return null;
		}
		
		return [
			'type' => [
				'$$type' => 'string',
				'value'  => 'linear',
			],
			'angle' => [
				'$$type' => 'number',
				'value'  => $angle,
			],
			'stops' => [
				'$$type' => 'gradient-color-stop',
				'value'  => $stops,
			],
		];
	}

	/**
	 * Upload image from URL to WordPress Media Library
	 * 
	 * @param string $image_url Image URL
	 * @return int|false Attachment ID or false on failure
	 */
	private function upload_image_from_url( $image_url ) {
		// Check if image already exists by URL
		global $wpdb;
		$existing = $wpdb->get_var( 
			$wpdb->prepare( 
				"SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_source_url' AND meta_value = %s LIMIT 1",
				$image_url 
			)
		);
		
		if ( $existing ) {
			error_log( "Image already exists with ID: $existing" );
			return intval( $existing );
		}
		
		// Download image
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
		
		$temp_file = download_url( $image_url );
		
		if ( is_wp_error( $temp_file ) ) {
			error_log( 'Failed to download image: ' . $temp_file->get_error_message() );
			return false;
		}
		
		// Get file name from URL
		$file_name = basename( parse_url( $image_url, PHP_URL_PATH ) );
		
		// If no extension, add .jpg
		if ( ! preg_match( '/\.(jpg|jpeg|png|gif|webp)$/i', $file_name ) ) {
			$file_name .= '.jpg';
		}
		
		// Prepare file array
		$file_array = [
			'name'     => $file_name,
			'tmp_name' => $temp_file,
		];
		
		// Upload to Media Library
		$attachment_id = media_handle_sideload( $file_array, 0 );
		
		// Clean up temp file
		if ( file_exists( $temp_file ) ) {
			@unlink( $temp_file );
		}
		
		if ( is_wp_error( $attachment_id ) ) {
			error_log( 'Failed to upload image: ' . $attachment_id->get_error_message() );
			return false;
		}
		
		// Store source URL as meta for future reference
		update_post_meta( $attachment_id, '_source_url', $image_url );
		
		error_log( "Image uploaded successfully with ID: $attachment_id" );
		return $attachment_id;
	}

	/**
	 * Generate unique element ID
	 */
	private function generate_id() {
		return substr( md5( uniqid( '', true ) ), 0, 7 );
	}
}
