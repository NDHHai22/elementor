<?php
/**
 * HTML Paste Widget
 * 
 * Widget này cho phép user paste HTML và tự động convert sang Elementor elements
 * Sử dụng HTML to Elementor Converter component
 * 
 * @package Angie
 * @subpackage ElementorCore
 */

namespace Angie\Modules\ElementorCore\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * HTML Paste Widget Class
 * 
 * Paste HTML và convert sang Elementor format
 */
class Html_Paste_Widget extends Widget_Base {

	/**
	 * Get widget name.
	 *
	 * @return string Widget name.
	 */
	public function get_name() {
		return 'angie-html-paste';
	}

	/**
	 * Get widget title.
	 *
	 * @return string Widget title.
	 */
	public function get_title() {
		return esc_html__( 'HTML Paste Converter', 'angie' );
	}

	/**
	 * Get widget icon.
	 *
	 * @return string Widget icon.
	 */
	public function get_icon() {
		return 'eicon-code';
	}

	/**
	 * Get widget categories.
	 *
	 * @return array Widget categories.
	 */
	public function get_categories() {
		return [ 'angie-elements' ];
	}

	/**
	 * Get widget keywords.
	 *
	 * @return array Widget keywords.
	 */
	public function get_keywords() {
		return [ 'html', 'paste', 'code', 'convert', 'angie', 'import' ];
	}

	/**
	 * Register widget controls.
	 */
	protected function register_controls() {
		// Content Section
		$this->start_controls_section(
			'content_section',
			[
				'label' => esc_html__( 'HTML Content', 'angie' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_control(
			'html_input',
			[
				'label'       => esc_html__( 'Paste HTML Here', 'angie' ),
				'type'        => Controls_Manager::CODE,
				'language'    => 'html',
				'rows'        => 20,
				'default'     => '<h1>Hello World</h1><p>This is a test paragraph.</p>',
				'placeholder' => esc_html__( 'Paste your HTML code here...', 'angie' ),
				'description' => esc_html__( 'Paste HTML and it will be automatically converted to Elementor elements.', 'angie' ),
			]
		);

		$this->add_control(
			'conversion_mode',
			[
				'label'       => esc_html__( 'Conversion Mode', 'angie' ),
				'type'        => Controls_Manager::SELECT,
				'default'     => 'smart',
				'options'     => [
					'smart' => esc_html__( 'Smart Convert (Recommended)', 'angie' ),
					'raw'   => esc_html__( 'Raw HTML Widget', 'angie' ),
				],
				'description' => esc_html__( 'Smart: Converts to Elementor widgets. Raw: Shows as HTML widget.', 'angie' ),
			]
		);

		$this->add_control(
			'convert_button',
			[
				'type'      => Controls_Manager::BUTTON,
				'text'      => esc_html__( 'Convert HTML', 'angie' ),
				'event'     => 'angie:convertHtml',
				'separator' => 'before',
			]
		);

		$this->add_control(
			'conversion_status',
			[
				'type'            => Controls_Manager::RAW_HTML,
				'raw'             => '<div class="angie-conversion-status"></div>',
				'content_classes' => 'angie-status-message',
			]
		);

		$this->end_controls_section();

		// Instructions Section
		$this->start_controls_section(
			'instructions_section',
			[
				'label' => esc_html__( 'Instructions', 'angie' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_control(
			'instructions',
			[
				'type' => Controls_Manager::RAW_HTML,
				'raw'  => '
					<div class="angie-instructions">
						<h4>' . esc_html__( 'How to Use:', 'angie' ) . '</h4>
						<ol>
							<li>' . esc_html__( 'Paste your HTML code in the field above', 'angie' ) . '</li>
							<li>' . esc_html__( 'Choose conversion mode (Smart or Raw)', 'angie' ) . '</li>
							<li>' . esc_html__( 'Click "Convert HTML" button', 'angie' ) . '</li>
							<li>' . esc_html__( 'Elements will be created automatically', 'angie' ) . '</li>
						</ol>
						<h4>' . esc_html__( 'Supported Tags:', 'angie' ) . '</h4>
						<ul>
							<li><code>h1-h6</code> → Heading Widget</li>
							<li><code>p</code> → Text Editor Widget</li>
							<li><code>img</code> → Image Widget</li>
							<li><code>a</code> → Button Widget</li>
							<li><code>ul/ol</code> → Icon List Widget</li>
							<li><code>div/section</code> → Section with Column</li>
							<li>' . esc_html__( 'Others → HTML Widget', 'angie' ) . '</li>
						</ul>
					</div>
				',
			]
		);

		$this->end_controls_section();

		// Style Section
		$this->start_controls_section(
			'style_section',
			[
				'label' => esc_html__( 'Preview Style', 'angie' ),
				'tab'   => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'preview_background',
			[
				'label'     => esc_html__( 'Background Color', 'angie' ),
				'type'      => Controls_Manager::COLOR,
				'default'   => '#f8f9fa',
				'selectors' => [
					'{{WRAPPER}} .angie-html-preview' => 'background-color: {{VALUE}};',
				],
			]
		);

		$this->add_responsive_control(
			'preview_padding',
			[
				'label'      => esc_html__( 'Padding', 'angie' ),
				'type'       => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', 'em', '%' ],
				'default'    => [
					'top'    => 20,
					'right'  => 20,
					'bottom' => 20,
					'left'   => 20,
					'unit'   => 'px',
				],
				'selectors'  => [
					'{{WRAPPER}} .angie-html-preview' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->end_controls_section();
	}

	/**
	 * Render widget output on the frontend.
	 */
	protected function render() {
		$settings = $this->get_settings_for_display();
		$html     = $settings['html_input'];
		$mode     = $settings['conversion_mode'];

		?>
		<div class="angie-html-paste-widget">
			<div class="angie-html-preview">
				<?php
				if ( 'raw' === $mode ) {
					// Raw mode: just display the HTML
					echo wp_kses_post( $html );
				} else {
					// Smart mode: show preview with conversion notice
					?>
					<div class="angie-smart-preview">
						<div class="angie-preview-notice">
							<span class="dashicons dashicons-info"></span>
							<?php esc_html_e( 'Click "Convert HTML" button in the editor to generate Elementor elements.', 'angie' ); ?>
						</div>
						<div class="angie-html-preview-content">
							<?php echo wp_kses_post( $html ); ?>
						</div>
					</div>
					<?php
				}
				?>
			</div>
		</div>
		<?php
	}

	/**
	 * Render widget output in the editor.
	 */
	protected function content_template() {
		?>
		<#
		var html = settings.html_input;
		var mode = settings.conversion_mode;
		#>
		<div class="angie-html-paste-widget">
			<div class="angie-html-preview">
				<# if ( 'raw' === mode ) { #>
					{{{ html }}}
				<# } else { #>
					<div class="angie-smart-preview">
						<div class="angie-preview-notice">
							<span class="dashicons dashicons-info"></span>
							<?php esc_html_e( 'Click "Convert HTML" button to generate Elementor elements.', 'angie' ); ?>
						</div>
						<div class="angie-html-preview-content">
							{{{ html }}}
						</div>
					</div>
				<# } #>
			</div>
		</div>

		<style>
			.angie-html-paste-widget {
				position: relative;
			}
			
			.angie-html-preview {
				border: 2px dashed #ddd;
				border-radius: 4px;
				min-height: 100px;
			}
			
			.angie-smart-preview {
				position: relative;
			}
			
			.angie-preview-notice {
				background: #92003B;
				color: white;
				padding: 10px 15px;
				border-radius: 4px 4px 0 0;
				display: flex;
				align-items: center;
				gap: 8px;
				font-size: 13px;
			}
			
			.angie-preview-notice .dashicons {
				width: 18px;
				height: 18px;
				font-size: 18px;
			}
			
			.angie-html-preview-content {
				padding: 20px;
			}
			
			.angie-instructions {
				background: #f8f9fa;
				padding: 15px;
				border-radius: 4px;
				border-left: 4px solid #92003B;
			}
			
			.angie-instructions h4 {
				margin: 10px 0;
				color: #92003B;
			}
			
			.angie-instructions ul,
			.angie-instructions ol {
				margin: 10px 0;
				padding-left: 20px;
			}
			
			.angie-instructions li {
				margin: 5px 0;
			}
			
			.angie-instructions code {
				background: #e9ecef;
				padding: 2px 6px;
				border-radius: 3px;
				font-family: monospace;
			}
			
			.angie-conversion-status {
				min-height: 30px;
				padding: 10px;
				margin-top: 10px;
				border-radius: 4px;
			}
			
			.angie-conversion-status.success {
				background: #d4edda;
				color: #155724;
				border: 1px solid #c3e6cb;
			}
			
			.angie-conversion-status.error {
				background: #f8d7da;
				color: #721c24;
				border: 1px solid #f5c6cb;
			}
			
			.angie-conversion-status.loading {
				background: #d1ecf1;
				color: #0c5460;
				border: 1px solid #bee5eb;
			}
		</style>

		<script>
			jQuery(document).ready(function($) {
				// Listen for convert button click
				elementor.channels.editor.on('angie:convertHtml', function(view) {
					var model = view.getEditModel();
					var html = model.getSetting('html_input');
					var mode = model.getSetting('conversion_mode');
					
					if (!html) {
						alert('<?php esc_html_e( 'Please paste HTML first!', 'angie' ); ?>');
						return;
					}
					
					if (mode !== 'smart') {
						alert('<?php esc_html_e( 'Please select "Smart Convert" mode to use this feature.', 'angie' ); ?>');
						return;
					}
					
					// Show loading status
					var $status = view.$el.find('.angie-conversion-status');
					$status.removeClass('success error').addClass('loading');
					$status.html('<?php esc_html_e( 'Converting HTML...', 'angie' ); ?>');
					
					// Call API to convert HTML
					$.ajax({
						url: '<?php echo esc_url( rest_url( 'angie/v1/html-to-elementor' ) ); ?>',
						method: 'POST',
						beforeSend: function(xhr) {
							xhr.setRequestHeader('X-WP-Nonce', '<?php echo wp_create_nonce( 'wp_rest' ); ?>');
						},
						data: {
							html: html
						},
						success: function(response) {
							if (response.success && response.elements) {
								// Get current section
								var currentSection = view.getContainer();
								var parent = currentSection.parent;
								
								// Insert converted elements after current widget
								response.elements.forEach(function(element) {
									$e.run('document/elements/create', {
										model: element,
										container: parent,
										options: {}
									});
								});
								
								// Show success message
								$status.removeClass('loading error').addClass('success');
								$status.html('<?php esc_html_e( '✓ HTML converted successfully! Check elements above/below.', 'angie' ); ?>');
								
								// Remove this widget after successful conversion
								setTimeout(function() {
									$e.run('document/elements/delete', {
										container: currentSection
									});
								}, 2000);
							} else {
								throw new Error('Invalid response');
							}
						},
						error: function(xhr, status, error) {
							$status.removeClass('loading success').addClass('error');
							$status.html('<?php esc_html_e( '✗ Conversion failed: ', 'angie' ); ?>' + error);
						}
					});
				});
			});
		</script>
		<?php
	}
}
