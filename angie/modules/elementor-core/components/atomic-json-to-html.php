<?php
/**
 * Atomic JSON to HTML Converter
 * Convert Elementor v4 Atomic Elements JSON back to HTML
 */

namespace Angie\Modules\ElementorCore\Components;

class Atomic_Json_To_Html {

	/**
	 * Convert Elementor v4 JSON to HTML
	 *
	 * @param array $elements Array of Elementor elements.
	 * @return string Generated HTML.
	 */
	public function convert( $elements ) {
		if ( empty( $elements ) || ! is_array( $elements ) ) {
			return '';
		}

		$html = '';
		foreach ( $elements as $element ) {
			$html .= $this->element_to_html( $element );
		}

		return $html;
	}

	/**
	 * Convert single element to HTML
	 *
	 * @param array $element Element data.
	 * @return string Element HTML.
	 */
	private function element_to_html( $element ) {
		if ( empty( $element ) || ! is_array( $element ) ) {
			return '';
		}

		$el_type = $element['elType'] ?? null;

		// Handle containers (div-block)
		if ( $el_type === 'e-div-block' ) {
			return $this->container_to_html( $element );
		}

		// Handle widgets
		if ( $el_type === 'widget' ) {
			$widget_type = $element['widgetType'] ?? '';
			
			switch ( $widget_type ) {
				case 'e-heading':
					return $this->heading_to_html( $element );
				
				case 'e-button':
					return $this->button_to_html( $element );
				
				case 'e-image':
					return $this->image_to_html( $element );
				
				case 'e-paragraph':
				default:
					return $this->paragraph_to_html( $element );
			}
		}

		return '';
	}

	/**
	 * Convert container to HTML
	 */
	private function container_to_html( $element ) {
		$children_html = '';
		
		// Process child elements
		if ( ! empty( $element['elements'] ) && is_array( $element['elements'] ) ) {
			foreach ( $element['elements'] as $child ) {
				$children_html .= $this->element_to_html( $child );
			}
		}

		// Get inline styles
		$style = $this->get_inline_style( $element );

		$html = '<div';
		if ( $style ) {
			$html .= ' style="' . esc_attr( $style ) . '"';
		}
		$html .= '>' . $children_html . '</div>';

		return $html;
	}

	/**
	 * Convert heading to HTML
	 */
	private function heading_to_html( $element ) {
		$settings = $element['settings'] ?? [];
		$title = $settings['title'] ?? 'Heading';
		$tag = $settings['tag'] ?? 'h2';
		
		// Ensure tag is a valid heading tag
		if ( ! in_array( $tag, [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ], true ) ) {
			$tag = 'h2';
		}

		// Get inline styles
		$style = $this->get_inline_style( $element );

		$html = '<' . $tag;
		if ( $style ) {
			$html .= ' style="' . esc_attr( $style ) . '"';
		}
		$html .= '>' . wp_kses_post( $title ) . '</' . $tag . '>';

		return $html;
	}

	/**
	 * Convert button to HTML
	 */
	private function button_to_html( $element ) {
		$settings = $element['settings'] ?? [];
		$text = $settings['text']['value'] ?? 'Button';
		$link = $settings['link']['value'] ?? [];
		
		// Get href
		$href = '#';
		if ( ! empty( $link['destination']['value'] ) ) {
			$href = $link['destination']['value'];
		} elseif ( ! empty( $link['url'] ) ) {
			$href = $link['url'];
		}

		// Get link target
		$target = '';
		if ( ! empty( $link['isTargetBlank']['value'] ) ) {
			$target = ' target="_blank"';
		} elseif ( ! empty( $link['target'] ) && $link['target'] === '_blank' ) {
			$target = ' target="_blank"';
		}

		// Get inline styles
		$style = $this->get_inline_style( $element );

		$html = '<a href="' . esc_url( $href ) . '"' . $target;
		if ( $style ) {
			$html .= ' style="' . esc_attr( $style ) . '"';
		}
		$html .= '>' . wp_kses_post( $text ) . '</a>';

		return $html;
	}

	/**
	 * Convert image to HTML
	 */
	private function image_to_html( $element ) {
		$settings = $element['settings'] ?? [];
		$image = $settings['image']['value'] ?? [];
		$alt = $settings['alt'] ?? '';

		// Get image URL
		$src = '';
		if ( ! empty( $image['src']['value'] ) ) {
			$src_value = $image['src']['value'];
			
			// Check for attachment ID
			if ( ! empty( $src_value['id']['value'] ) && ! empty( $src_value['id']['value'] ) ) {
				$attachment_id = $src_value['id']['value'];
				
				// Get image URL from attachment
				if ( $attachment_id > 0 ) {
					$src = wp_get_attachment_url( $attachment_id );
				}
			}
			
			// Fallback to direct URL
			if ( empty( $src ) && ! empty( $src_value['url'] ) ) {
				$src = $src_value['url'];
			}
		}

		if ( empty( $src ) ) {
			return '<!-- Empty image -->';
		}

		// Get inline styles
		$style = $this->get_inline_style( $element );

		$html = '<img src="' . esc_url( $src ) . '" alt="' . esc_attr( $alt ) . '"';
		if ( $style ) {
			$html .= ' style="' . esc_attr( $style ) . '"';
		}
		$html .= '>';

		return $html;
	}

	/**
	 * Convert paragraph to HTML
	 */
	private function paragraph_to_html( $element ) {
		$settings = $element['settings'] ?? [];
		$content = $settings['paragraph']['value'] ?? '';

		// Get inline styles
		$style = $this->get_inline_style( $element );

		$html = '<p';
		if ( $style ) {
			$html .= ' style="' . esc_attr( $style ) . '"';
		}
		$html .= '>' . wp_kses_post( $content ) . '</p>';

		return $html;
	}

	/**
	 * Extract inline styles from element
	 *
	 * @param array $element Element data.
	 * @return string Inline CSS.
	 */
	private function get_inline_style( $element ) {
		$styles = $element['styles'] ?? [];
		if ( empty( $styles ) || ! is_array( $styles ) ) {
			return '';
		}

		// Get first style class
		$first_class = reset( $styles );
		if ( ! is_array( $first_class ) ) {
			return '';
		}

		$variants = $first_class['variants'] ?? [];
		if ( empty( $variants ) || ! is_array( $variants ) ) {
			return '';
		}

		// Get desktop variant
		$desktop = reset( $variants );
		if ( ! is_array( $desktop ) ) {
			return '';
		}

		$props = $desktop['props'] ?? [];
		if ( empty( $props ) || ! is_array( $props ) ) {
			return '';
		}

		// Convert atomic props to CSS
		return $this->props_to_css( $props );
	}

	/**
	 * Convert atomic typed props to CSS
	 *
	 * @param array $props Atomic properties.
	 * @return string CSS string.
	 */
	private function props_to_css( $props ) {
		$css = '';

		foreach ( $props as $prop_name => $prop_value ) {
			if ( ! is_array( $prop_value ) ) {
				continue;
			}

			$prop_type = $prop_value['$$type'] ?? '';
			$value = $prop_value['value'] ?? null;

			if ( $value === null ) {
				continue;
			}

			// Handle different property types
			switch ( $prop_name ) {
				// Dimensions (padding, margin)
				case 'padding':
				case 'margin':
					$css .= $this->dimension_to_css( $prop_name, $value );
					break;

				// Colors
				case 'color':
				case 'border-color':
				case 'background-color':
					$css .= $prop_name . ': ' . sanitize_hex_color( $value ) . ';';
					break;

				// Background
				case 'background':
					$css .= $this->background_to_css( $value );
					break;

				// Border radius
				case 'border-radius':
					$css .= $this->border_radius_to_css( $value );
					break;

				// Sizes
				case 'width':
				case 'height':
				case 'font-size':
				case 'line-height':
				case 'z-index':
					$css .= $this->size_to_css( $prop_name, $value );
					break;

				// Opacity
				case 'opacity':
					if ( is_array( $value ) && isset( $value['value'] ) ) {
						$css .= 'opacity: ' . floatval( $value['value'] ) . ';';
					} elseif ( is_numeric( $value ) ) {
						$css .= 'opacity: ' . floatval( $value ) . ';';
					}
					break;

				// String properties (display, position, etc.)
				case 'display':
				case 'position':
				case 'cursor':
				case 'text-align':
				case 'font-weight':
				case 'border-style':
				case 'overflow':
				case 'flex-direction':
				case 'justify-content':
				case 'align-items':
					if ( is_array( $value ) && isset( $value['value'] ) ) {
						$css .= $prop_name . ': ' . sanitize_text_field( $value['value'] ) . ';';
					} elseif ( is_string( $value ) ) {
						$css .= $prop_name . ': ' . sanitize_text_field( $value ) . ';';
					}
					break;

				// Box shadow
				case 'box-shadow':
					$css .= $this->box_shadow_to_css( $value );
					break;

				// Classes (skip)
				case 'classes':
					break;

				// Other string properties
				default:
					if ( is_array( $value ) && isset( $value['value'] ) ) {
						$css .= $prop_name . ': ' . sanitize_text_field( $value['value'] ) . ';';
					} elseif ( is_string( $value ) ) {
						$css .= $prop_name . ': ' . sanitize_text_field( $value ) . ';';
					}
					break;
			}
		}

		return $css;
	}

	/**
	 * Convert dimension prop to CSS
	 *
	 * @param string $prop_name Property name (padding, margin).
	 * @param array  $value Dimension values.
	 * @return string CSS.
	 */
	private function dimension_to_css( $prop_name, $value ) {
		if ( ! is_array( $value ) ) {
			return '';
		}

		$css = '';
		$sides = [
			'block-start'  => 'top',
			'block-end'    => 'bottom',
			'inline-start' => 'left',
			'inline-end'   => 'right',
		];

		foreach ( $sides as $logical => $physical ) {
			if ( isset( $value[ $logical ] ) ) {
				$side_value = $value[ $logical ];
				$css_value = $this->size_value_to_string( $side_value );
				if ( $css_value ) {
					$css .= $prop_name . '-' . $physical . ': ' . $css_value . ';';
				}
			}
		}

		return $css;
	}

	/**
	 * Convert background prop to CSS
	 *
	 * @param array $value Background value.
	 * @return string CSS.
	 */
	private function background_to_css( $value ) {
		if ( ! is_array( $value ) ) {
			return '';
		}

		$css = '';

		// Solid color background
		if ( ! empty( $value['color']['value'] ) ) {
			$css .= 'background-color: ' . sanitize_hex_color( $value['color']['value'] ) . ';';
		}

		// Background image overlay
		if ( ! empty( $value['background-overlay'] ) ) {
			$overlays = $value['background-overlay']['value'] ?? [];
			if ( is_array( $overlays ) && count( $overlays ) > 0 ) {
				$overlay = reset( $overlays );
				if ( is_array( $overlay ) ) {
					$overlay_value = $overlay['value'] ?? [];
					
					// Image URL
					if ( ! empty( $overlay_value['url']['value'] ) ) {
						$image_url = $overlay_value['url']['value'];
						$css .= 'background-image: url(' . esc_url_raw( $image_url ) . ');';
						
						// Image properties
						if ( ! empty( $overlay_value['size']['value'] ) ) {
							$css .= 'background-size: ' . sanitize_text_field( $overlay_value['size']['value'] ) . ';';
						}
						
						if ( ! empty( $overlay_value['position']['value'] ) ) {
							$css .= 'background-position: ' . sanitize_text_field( $overlay_value['position']['value'] ) . ';';
						}
						
						if ( ! empty( $overlay_value['repeat']['value'] ) ) {
							$css .= 'background-repeat: ' . sanitize_text_field( $overlay_value['repeat']['value'] ) . ';';
						}
						
						if ( ! empty( $overlay_value['attachment']['value'] ) ) {
							$css .= 'background-attachment: ' . sanitize_text_field( $overlay_value['attachment']['value'] ) . ';';
						}
					}
				}
			}
		}

		return $css;
	}

	/**
	 * Convert border-radius prop to CSS
	 *
	 * @param array $value Border-radius value.
	 * @return string CSS.
	 */
	private function border_radius_to_css( $value ) {
		if ( is_array( $value ) && isset( $value['value'] ) ) {
			$size_str = $this->size_value_to_string( $value );
			return $size_str ? 'border-radius: ' . $size_str . ';' : '';
		}

		// Check if it's a dimension-type border-radius (with corners)
		if ( is_array( $value ) ) {
			$css = '';
			$corners = [
				'top-left'     => 'border-top-left-radius',
				'top-right'    => 'border-top-right-radius',
				'bottom-right' => 'border-bottom-right-radius',
				'bottom-left'  => 'border-bottom-left-radius',
			];

			foreach ( $corners as $corner => $css_prop ) {
				if ( isset( $value[ $corner ] ) ) {
					$size_str = $this->size_value_to_string( $value[ $corner ] );
					if ( $size_str ) {
						$css .= $css_prop . ': ' . $size_str . ';';
					}
				}
			}

			return $css;
		}

		return '';
	}

	/**
	 * Convert size prop to CSS
	 *
	 * @param string $prop_name Property name.
	 * @param array  $value Size value.
	 * @return string CSS.
	 */
	private function size_to_css( $prop_name, $value ) {
		$size_str = $this->size_value_to_string( $value );
		return $size_str ? $prop_name . ': ' . $size_str . ';' : '';
	}

	/**
	 * Convert size value object to CSS string
	 *
	 * @param array|mixed $value Size value.
	 * @return string CSS size value (e.g., "16px").
	 */
	private function size_value_to_string( $value ) {
		if ( ! is_array( $value ) ) {
			return '';
		}

		// Handle typed size value
		if ( isset( $value['$$type'] ) && $value['$$type'] === 'size' ) {
			$value = $value['value'] ?? [];
		}

		if ( ! is_array( $value ) ) {
			return '';
		}

		$size = $value['size'] ?? 0;
		$unit = $value['unit'] ?? 'px';

		// Handle auto unit
		if ( $unit === 'auto' ) {
			return 'auto';
		}

		// Handle unitless (convert to string without unit)
		if ( empty( $unit ) ) {
			return (string) $size;
		}

		return $size . $unit;
	}

	/**
	 * Convert box-shadow prop to CSS
	 *
	 * @param array $value Box-shadow value.
	 * @return string CSS.
	 */
	private function box_shadow_to_css( $value ) {
		if ( ! is_array( $value ) ) {
			return '';
		}

		$shadows = [];

		// Handle array of shadows or single shadow
		$shadow_list = is_array( $value ) && isset( $value[0] ) ? $value : [ $value ];

		foreach ( $shadow_list as $shadow ) {
			if ( ! is_array( $shadow ) || ! isset( $shadow['value'] ) ) {
				continue;
			}

			$shadow_val = $shadow['value'];
			
			$offset_x = $shadow_val['offset-x']['value'] ?? 0;
			$offset_y = $shadow_val['offset-y']['value'] ?? 0;
			$blur = $shadow_val['blur']['value'] ?? 0;
			$spread = $shadow_val['spread']['value'] ?? 0;
			$color = $shadow_val['color']['value'] ?? '#000';
			$inset = ! empty( $shadow_val['inset']['value'] ) ? 'inset ' : '';

			$shadows[] = $inset . $offset_x . 'px ' . $offset_y . 'px ' . $blur . 'px ' . $spread . 'px ' . sanitize_hex_color( $color );
		}

		return ! empty( $shadows ) ? 'box-shadow: ' . implode( ', ', $shadows ) . ';' : '';
	}
}
