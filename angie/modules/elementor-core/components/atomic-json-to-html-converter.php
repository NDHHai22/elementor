<?php
/**
 * Atomic JSON to HTML Converter
 * 
 * Converts Elementor v4 Atomic Elements JSON back to HTML
 * 
 * @package Angie
 */

namespace Angie\Modules\ElementorCore\Components;

class Atomic_Json_To_Html_Converter {

	/**
	 * Convert Elementor v4 JSON to HTML
	 *
	 * @param array $elements Array of Elementor elements.
	 * @return string HTML string.
	 */
	public function convert( $elements ) {
		if ( empty( $elements ) ) {
			return '';
		}

		$html = '';
		foreach ( $elements as $element ) {
			$html .= $this->convert_element( $element );
		}

		return $html;
	}

	/**
	 * Convert single element to HTML
	 *
	 * @param array $element Elementor element.
	 * @return string HTML.
	 */
	private function convert_element( $element ) {
		if ( empty( $element['elType'] ) ) {
			return '';
		}

		$el_type = $element['elType'];

		if ( $el_type === 'widget' ) {
			return $this->convert_widget( $element );
		} elseif ( $el_type === 'e-div-block' ) {
			return $this->convert_container( $element );
		}

		return '';
	}

	/**
	 * Convert container (e-div-block) to HTML
	 *
	 * @param array $element Container element.
	 * @return string HTML.
	 */
	private function convert_container( $element ) {
		$attributes = $this->get_element_attributes( $element );
		$children_html = '';

		// Process children
		if ( ! empty( $element['elements'] ) ) {
			foreach ( $element['elements'] as $child ) {
				$children_html .= $this->convert_element( $child );
			}
		}

		return sprintf(
			'<div%s>%s</div>',
			$attributes,
			$children_html
		);
	}

	/**
	 * Convert widget to HTML
	 *
	 * @param array $element Widget element.
	 * @return string HTML.
	 */
	private function convert_widget( $element ) {
		$widget_type = $element['widgetType'] ?? '';
		$settings = $element['settings'] ?? [];

		switch ( $widget_type ) {
			case 'e-heading':
				return $this->convert_heading( $element, $settings );
			case 'e-button':
				return $this->convert_button( $element, $settings );
			case 'e-paragraph':
				return $this->convert_paragraph( $element, $settings );
			case 'e-image':
				return $this->convert_image( $element, $settings );
			default:
				return $this->convert_generic_widget( $element, $settings );
		}
	}

	/**
	 * Convert heading widget to HTML
	 *
	 * @param array $element Widget element.
	 * @param array $settings Widget settings.
	 * @return string HTML.
	 */
	private function convert_heading( $element, $settings ) {
		$title = $settings['title'] ?? 'Heading';
		$tag = $settings['tag'] ?? 'h2';
		$attributes = $this->get_element_attributes( $element );

		return sprintf(
			'<%1$s%2$s>%3$s</%1$s>',
			$tag,
			$attributes,
			htmlspecialchars( $title, ENT_QUOTES, 'UTF-8' )
		);
	}

	/**
	 * Convert button widget to HTML
	 *
	 * @param array $element Widget element.
	 * @param array $settings Widget settings.
	 * @return string HTML.
	 */
	private function convert_button( $element, $settings ) {
		$text = '';
		if ( isset( $settings['text']['value'] ) ) {
			$text = $settings['text']['value'];
		}

		$href = '#';
		if ( ! empty( $settings['link']['value']['destination']['value'] ) ) {
			$href = $settings['link']['value']['destination']['value'];
		}

		$attributes = $this->get_element_attributes( $element );

		return sprintf(
			'<a href="%s"%s>%s</a>',
			htmlspecialchars( $href, ENT_QUOTES, 'UTF-8' ),
			$attributes,
			htmlspecialchars( $text, ENT_QUOTES, 'UTF-8' )
		);
	}

	/**
	 * Convert paragraph widget to HTML
	 *
	 * @param array $element Widget element.
	 * @param array $settings Widget settings.
	 * @return string HTML.
	 */
	private function convert_paragraph( $element, $settings ) {
		$html = '';
		if ( isset( $settings['paragraph']['value'] ) ) {
			$html = $settings['paragraph']['value'];
		}

		$attributes = $this->get_element_attributes( $element );

		return sprintf(
			'<p%s>%s</p>',
			$attributes,
			$html
		);
	}

	/**
	 * Convert image widget to HTML
	 *
	 * @param array $element Widget element.
	 * @param array $settings Widget settings.
	 * @return string HTML.
	 */
	private function convert_image( $element, $settings ) {
		$src = '';
		$alt = $settings['alt'] ?? '';

		// Get image URL from attachment ID or direct URL
		if ( ! empty( $settings['image']['value']['src']['value']['id']['value'] ) ) {
			$attachment_id = $settings['image']['value']['src']['value']['id']['value'];
			if ( $attachment_id > 0 ) {
				$src = wp_get_attachment_url( $attachment_id );
			}
		}

		// Fallback to direct URL
		if ( empty( $src ) && ! empty( $settings['image']['value']['src']['value']['url'] ) ) {
			$src = $settings['image']['value']['src']['value']['url'];
		}

		if ( empty( $src ) ) {
			return '';
		}

		$attributes = $this->get_element_attributes( $element );

		return sprintf(
			'<img src="%s" alt="%s"%s />',
			htmlspecialchars( $src, ENT_QUOTES, 'UTF-8' ),
			htmlspecialchars( $alt, ENT_QUOTES, 'UTF-8' ),
			$attributes
		);
	}

	/**
	 * Convert generic widget to div
	 *
	 * @param array $element Widget element.
	 * @param array $settings Widget settings.
	 * @return string HTML.
	 */
	private function convert_generic_widget( $element, $settings ) {
		$attributes = $this->get_element_attributes( $element );
		$html = '';

		// Try to get text content from various settings
		if ( isset( $settings['text']['value'] ) ) {
			$html = htmlspecialchars( $settings['text']['value'], ENT_QUOTES, 'UTF-8' );
		}

		return sprintf(
			'<div%s>%s</div>',
			$attributes,
			$html
		);
	}

	/**
	 * Get element attributes (inline styles from CSS classes)
	 *
	 * @param array $element Element.
	 * @return string Attributes string (e.g., ' style="..."').
	 */
	private function get_element_attributes( $element ) {
		$style = $this->get_element_inline_styles( $element );

		if ( empty( $style ) ) {
			return '';
		}

		return ' style="' . htmlspecialchars( $style, ENT_QUOTES, 'UTF-8' ) . '"';
	}

	/**
	 * Get inline styles from element's style classes
	 *
	 * @param array $element Element.
	 * @return string CSS string.
	 */
	private function get_element_inline_styles( $element ) {
		$styles = $element['styles'] ?? [];
		if ( empty( $styles ) ) {
			return '';
		}

		$css_properties = [];

		// Iterate through style classes
		foreach ( $styles as $class_id => $style_obj ) {
			if ( empty( $style_obj['variants'] ) ) {
				continue;
			}

			// Get desktop variant
			foreach ( $style_obj['variants'] as $variant ) {
				if ( $variant['meta']['breakpoint'] !== 'desktop' ) {
					continue;
				}

				$props = $variant['props'] ?? [];

				// Convert typed properties to CSS
				foreach ( $props as $prop_name => $prop_value ) {
					$css = $this->convert_prop_to_css( $prop_name, $prop_value );
					if ( $css ) {
						$css_properties[] = $css;
					}
				}
			}
		}

		return implode( '; ', $css_properties );
	}

	/**
	 * Convert typed property to CSS declaration
	 *
	 * @param string $prop_name Property name.
	 * @param array  $prop_value Property value with $$type.
	 * @return string CSS declaration (e.g., 'color: red').
	 */
	private function convert_prop_to_css( $prop_name, $prop_value ) {
		if ( empty( $prop_value['$$type'] ) ) {
			return '';
		}

		$type = $prop_value['$$type'];
		$value = $prop_value['value'] ?? null;

		if ( $value === null ) {
			return '';
		}

		switch ( $type ) {
			case 'color':
				return sprintf( '%s: %s', $prop_name, htmlspecialchars( $value, ENT_QUOTES, 'UTF-8' ) );

			case 'size':
				if ( is_array( $value ) ) {
					$size = $value['size'] ?? 0;
					$unit = $value['unit'] ?? 'px';
					if ( $unit === 'auto' ) {
						return sprintf( '%s: auto', $prop_name );
					}
					return sprintf( '%s: %s%s', $prop_name, $size, $unit );
				}
				return '';

			case 'string':
				return sprintf( '%s: %s', $prop_name, htmlspecialchars( $value, ENT_QUOTES, 'UTF-8' ) );

			case 'dimensions':
				return $this->convert_dimensions_to_css( $prop_name, $value );

			case 'background':
				return $this->convert_background_to_css( $value );

			case 'number':
				return sprintf( '%s: %s', $prop_name, intval( $value ) );

			default:
				return '';
		}
	}

	/**
	 * Convert dimensions to CSS (padding, margin)
	 *
	 * @param string $prop_name Property name (padding, margin).
	 * @param array  $value Dimensions value with logical properties.
	 * @return string CSS declarations.
	 */
	private function convert_dimensions_to_css( $prop_name, $value ) {
		$declarations = [];

		// Map logical properties to physical
		$mapping = [
			'block-start'   => $prop_name . '-top',
			'block-end'     => $prop_name . '-bottom',
			'inline-start'  => $prop_name . '-left',
			'inline-end'    => $prop_name . '-right',
		];

		foreach ( $mapping as $logical => $physical ) {
			if ( isset( $value[ $logical ] ) ) {
				$size_value = $value[ $logical ];
				if ( ! empty( $size_value['$$type'] ) && $size_value['$$type'] === 'size' ) {
					$size = $size_value['value']['size'] ?? 0;
					$unit = $size_value['value']['unit'] ?? 'px';
					$declarations[] = sprintf( '%s: %s%s', $physical, $size, $unit );
				}
			}
		}

		return implode( '; ', $declarations );
	}

	/**
	 * Convert background to CSS
	 *
	 * @param array $value Background value.
	 * @return string CSS declarations.
	 */
	private function convert_background_to_css( $value ) {
		$declarations = [];

		// Handle color
		if ( ! empty( $value['color']['$$type'] ) && $value['color']['$$type'] === 'color' ) {
			$declarations[] = sprintf( 'background-color: %s', htmlspecialchars( $value['color']['value'], ENT_QUOTES, 'UTF-8' ) );
		}

		// Handle image overlay
		if ( ! empty( $value['background-overlay'] ) ) {
			$overlays = $value['background-overlay']['value'] ?? [];
			foreach ( $overlays as $overlay ) {
				if ( $overlay['$$type'] === 'background-image-overlay' && ! empty( $overlay['value'] ) ) {
					$img_value = $overlay['value'];

					// Extract image URL
					if ( ! empty( $img_value['id']['value'] ) && $img_value['id']['value'] > 0 ) {
						$url = wp_get_attachment_url( $img_value['id']['value'] );
					} elseif ( ! empty( $img_value['url'] ) ) {
						$url = $img_value['url'];
					} else {
						continue;
					}

					$declarations[] = sprintf( 'background-image: url(%s)', htmlspecialchars( $url, ENT_QUOTES, 'UTF-8' ) );

					// Background size
					if ( ! empty( $img_value['size']['value'] ) ) {
						$declarations[] = sprintf( 'background-size: %s', htmlspecialchars( $img_value['size']['value'], ENT_QUOTES, 'UTF-8' ) );
					}

					// Background position
					if ( ! empty( $img_value['position']['value'] ) ) {
						$declarations[] = sprintf( 'background-position: %s', htmlspecialchars( $img_value['position']['value'], ENT_QUOTES, 'UTF-8' ) );
					}

					// Background repeat
					if ( ! empty( $img_value['repeat']['value'] ) ) {
						$declarations[] = sprintf( 'background-repeat: %s', htmlspecialchars( $img_value['repeat']['value'], ENT_QUOTES, 'UTF-8' ) );
					}

					// Background attachment
					if ( ! empty( $img_value['attachment']['value'] ) ) {
						$declarations[] = sprintf( 'background-attachment: %s', htmlspecialchars( $img_value['attachment']['value'], ENT_QUOTES, 'UTF-8' ) );
					}
				}
			}
		}

		return implode( '; ', $declarations );
	}
}
