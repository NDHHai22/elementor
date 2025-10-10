<?php
/**
 * Angie Test Button Widget
 * 
 * Đây là một widget đơn giản để test tương tác giữa Angie plugin và Elementor
 * Widget này tạo một button có thể customize màu sắc, text, và link
 * 
 * @package Angie
 * @subpackage ElementorCore
 */

namespace Angie\Modules\ElementorCore\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Box_Shadow;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Angie Test Button Widget
 * 
 * Widget đơn giản để test khả năng tích hợp của Angie với Elementor
 */
class Angie_Test_Button extends Widget_Base {

	/**
	 * Get widget name.
	 *
	 * @return string Widget name.
	 */
	public function get_name() {
		return 'angie-test-button';
	}

	/**
	 * Get widget title.
	 *
	 * @return string Widget title.
	 */
	public function get_title() {
		return esc_html__( 'Angie Test Button', 'angie' );
	}

	/**
	 * Get widget icon.
	 *
	 * @return string Widget icon.
	 */
	public function get_icon() {
		return 'eicon-button';
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
		return [ 'button', 'angie', 'test', 'link', 'cta' ];
	}

	/**
	 * Register widget controls.
	 */
	protected function register_controls() {
		// Content Section
		$this->start_controls_section(
			'content_section',
			[
				'label' => esc_html__( 'Content', 'angie' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_control(
			'button_text',
			[
				'label'       => esc_html__( 'Button Text', 'angie' ),
				'type'        => Controls_Manager::TEXT,
				'default'     => esc_html__( 'Click Me!', 'angie' ),
				'placeholder' => esc_html__( 'Enter button text', 'angie' ),
				'dynamic'     => [
					'active' => true,
				],
			]
		);

		$this->add_control(
			'button_link',
			[
				'label'       => esc_html__( 'Link', 'angie' ),
				'type'        => Controls_Manager::URL,
				'placeholder' => esc_html__( 'https://your-link.com', 'angie' ),
				'default'     => [
					'url'         => '#',
					'is_external' => false,
					'nofollow'    => false,
				],
			]
		);

		$this->add_control(
			'button_icon',
			[
				'label'       => esc_html__( 'Icon', 'angie' ),
				'type'        => Controls_Manager::ICONS,
				'default'     => [
					'value'   => 'fas fa-arrow-right',
					'library' => 'fa-solid',
				],
			]
		);

		$this->add_control(
			'icon_position',
			[
				'label'   => esc_html__( 'Icon Position', 'angie' ),
				'type'    => Controls_Manager::CHOOSE,
				'default' => 'right',
				'options' => [
					'left'  => [
						'title' => esc_html__( 'Left', 'angie' ),
						'icon'  => 'eicon-h-align-left',
					],
					'right' => [
						'title' => esc_html__( 'Right', 'angie' ),
						'icon'  => 'eicon-h-align-right',
					],
				],
				'toggle'  => false,
			]
		);

		$this->end_controls_section();

		// Style Section
		$this->start_controls_section(
			'style_section',
			[
				'label' => esc_html__( 'Button Style', 'angie' ),
				'tab'   => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name'     => 'button_typography',
				'selector' => '{{WRAPPER}} .angie-test-button',
			]
		);

		$this->start_controls_tabs( 'button_style_tabs' );

		// Normal State
		$this->start_controls_tab(
			'button_normal',
			[
				'label' => esc_html__( 'Normal', 'angie' ),
			]
		);

		$this->add_control(
			'button_text_color',
			[
				'label'     => esc_html__( 'Text Color', 'angie' ),
				'type'      => Controls_Manager::COLOR,
				'default'   => '#ffffff',
				'selectors' => [
					'{{WRAPPER}} .angie-test-button' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'button_background_color',
			[
				'label'     => esc_html__( 'Background Color', 'angie' ),
				'type'      => Controls_Manager::COLOR,
				'default'   => '#92003B',
				'selectors' => [
					'{{WRAPPER}} .angie-test-button' => 'background-color: {{VALUE}};',
				],
			]
		);

		$this->end_controls_tab();

		// Hover State
		$this->start_controls_tab(
			'button_hover',
			[
				'label' => esc_html__( 'Hover', 'angie' ),
			]
		);

		$this->add_control(
			'button_hover_text_color',
			[
				'label'     => esc_html__( 'Text Color', 'angie' ),
				'type'      => Controls_Manager::COLOR,
				'default'   => '#ffffff',
				'selectors' => [
					'{{WRAPPER}} .angie-test-button:hover' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'button_hover_background_color',
			[
				'label'     => esc_html__( 'Background Color', 'angie' ),
				'type'      => Controls_Manager::COLOR,
				'default'   => '#D5001C',
				'selectors' => [
					'{{WRAPPER}} .angie-test-button:hover' => 'background-color: {{VALUE}};',
				],
			]
		);

		$this->end_controls_tab();

		$this->end_controls_tabs();

		$this->add_responsive_control(
			'button_padding',
			[
				'label'      => esc_html__( 'Padding', 'angie' ),
				'type'       => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', 'em', '%' ],
				'default'    => [
					'top'    => 15,
					'right'  => 30,
					'bottom' => 15,
					'left'   => 30,
					'unit'   => 'px',
				],
				'selectors'  => [
					'{{WRAPPER}} .angie-test-button' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
				'separator'  => 'before',
			]
		);

		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name'     => 'button_border',
				'selector' => '{{WRAPPER}} .angie-test-button',
			]
		);

		$this->add_control(
			'button_border_radius',
			[
				'label'      => esc_html__( 'Border Radius', 'angie' ),
				'type'       => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%' ],
				'default'    => [
					'top'    => 5,
					'right'  => 5,
					'bottom' => 5,
					'left'   => 5,
					'unit'   => 'px',
				],
				'selectors'  => [
					'{{WRAPPER}} .angie-test-button' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Box_Shadow::get_type(),
			[
				'name'     => 'button_box_shadow',
				'selector' => '{{WRAPPER}} .angie-test-button',
			]
		);

		$this->end_controls_section();
	}

	/**
	 * Render widget output on the frontend.
	 */
	protected function render() {
		$settings = $this->get_settings_for_display();

		// Prepare link attributes
		$this->add_link_attributes( 'button_link', $settings['button_link'] );
		$this->add_render_attribute(
			'button',
			[
				'class' => 'angie-test-button',
				'role'  => 'button',
			]
		);

		// Start rendering
		?>
		<div class="angie-test-button-wrapper">
			<a <?php echo $this->get_render_attribute_string( 'button' ); ?> <?php echo $this->get_render_attribute_string( 'button_link' ); ?>>
				<?php if ( 'left' === $settings['icon_position'] && ! empty( $settings['button_icon']['value'] ) ) : ?>
					<span class="angie-button-icon angie-icon-left">
						<?php \Elementor\Icons_Manager::render_icon( $settings['button_icon'], [ 'aria-hidden' => 'true' ] ); ?>
					</span>
				<?php endif; ?>
				
				<span class="angie-button-text">
					<?php echo esc_html( $settings['button_text'] ); ?>
				</span>

				<?php if ( 'right' === $settings['icon_position'] && ! empty( $settings['button_icon']['value'] ) ) : ?>
					<span class="angie-button-icon angie-icon-right">
						<?php \Elementor\Icons_Manager::render_icon( $settings['button_icon'], [ 'aria-hidden' => 'true' ] ); ?>
					</span>
				<?php endif; ?>
			</a>
		</div>
		<?php
	}

	/**
	 * Render widget output in the editor.
	 */
	protected function content_template() {
		?>
		<#
		var iconHTML = elementor.helpers.renderIcon( view, settings.button_icon, { 'aria-hidden': true }, 'i' , 'object' );
		
		view.addRenderAttribute( 'button', 'class', 'angie-test-button' );
		view.addRenderAttribute( 'button', 'role', 'button' );
		
		view.addRenderAttribute( 'button_link', 'href', settings.button_link.url );
		#>
		<div class="angie-test-button-wrapper">
			<a {{{ view.getRenderAttributeString( 'button' ) }}} {{{ view.getRenderAttributeString( 'button_link' ) }}}>
				<# if ( 'left' === settings.icon_position && iconHTML.rendered ) { #>
					<span class="angie-button-icon angie-icon-left">
						{{{ iconHTML.value }}}
					</span>
				<# } #>
				
				<span class="angie-button-text">
					{{{ settings.button_text }}}
				</span>

				<# if ( 'right' === settings.icon_position && iconHTML.rendered ) { #>
					<span class="angie-button-icon angie-icon-right">
						{{{ iconHTML.value }}}
					</span>
				<# } #>
			</a>
		</div>
		<?php
	}
}
