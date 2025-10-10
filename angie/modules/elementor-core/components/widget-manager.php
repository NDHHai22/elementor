<?php
/**
 * Widget Manager Component
 * 
 * Component này chịu trách nhiệm:
 * 1. Đăng ký custom category cho Angie widgets
 * 2. Đăng ký tất cả Angie widgets với Elementor
 * 3. Quản lý widget registration lifecycle
 * 
 * @package Angie
 * @subpackage ElementorCore
 */

namespace Angie\Modules\ElementorCore\Components;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Widget Manager Class
 * 
 * Quản lý việc đăng ký widgets với Elementor
 */
class Widget_Manager {

	/**
	 * Constructor
	 * 
	 * Hook vào Elementor để đăng ký widgets
	 */
	public function __construct() {
		// Đăng ký custom category cho Angie widgets
		add_action( 'elementor/elements/categories_registered', [ $this, 'register_widget_categories' ] );
		
		// Đăng ký widgets
		add_action( 'elementor/widgets/register', [ $this, 'register_widgets' ] );
		
		// Enqueue widget styles (nếu cần)
		add_action( 'elementor/frontend/after_enqueue_styles', [ $this, 'enqueue_widget_styles' ] );
	}

	/**
	 * Đăng ký custom category cho Angie widgets
	 * 
	 * Category này sẽ xuất hiện trong Elementor panel
	 * và chứa tất cả widgets của Angie
	 * 
	 * @param \Elementor\Elements_Manager $elements_manager Elementor elements manager instance.
	 */
	public function register_widget_categories( $elements_manager ) {
		$elements_manager->add_category(
			'angie-elements',
			[
				'title' => esc_html__( 'Angie Elements', 'angie' ),
				'icon'  => 'fa fa-plug',
			]
		);
	}

	/**
	 * Đăng ký tất cả Angie widgets với Elementor
	 * 
	 * Method này được gọi bởi Elementor khi nó ready để nhận widgets
	 * 
	 * @param \Elementor\Widgets_Manager $widgets_manager Elementor widgets manager instance.
	 */
	public function register_widgets( $widgets_manager ) {
		// Include widget files
		require_once ANGIE_PATH . 'modules/elementor-core/widgets/angie-test-button.php';
		require_once ANGIE_PATH . 'modules/elementor-core/widgets/html-paste-widget.php';
		
		// Register widgets
		$widgets_manager->register( new \Angie\Modules\ElementorCore\Widgets\Angie_Test_Button() );
		$widgets_manager->register( new \Angie\Modules\ElementorCore\Widgets\Html_Paste_Widget() );
		
		/**
		 * Hook để cho phép đăng ký thêm widgets khác
		 * 
		 * @param \Elementor\Widgets_Manager $widgets_manager Elementor widgets manager instance.
		 */
		do_action( 'angie/elementor/widgets/register', $widgets_manager );
	}

	/**
	 * Enqueue widget styles
	 * 
	 * Load CSS cho widgets (nếu cần)
	 */
	public function enqueue_widget_styles() {
		// Inline CSS cho widget (có thể move sang file riêng nếu lớn)
		$custom_css = "
			.angie-test-button-wrapper {
				display: inline-block;
			}
			
			.angie-test-button {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				gap: 8px;
				text-decoration: none;
				transition: all 0.3s ease;
				cursor: pointer;
				font-weight: 600;
			}
			
			.angie-test-button:hover {
				transform: translateY(-2px);
			}
			
			.angie-button-icon {
				display: inline-flex;
				align-items: center;
			}
			
			.angie-icon-left {
				margin-right: 5px;
			}
			
			.angie-icon-right {
				margin-left: 5px;
			}
			
			.angie-button-text {
				display: inline-block;
			}
		";
		
		wp_add_inline_style( 'elementor-frontend', $custom_css );
	}
}
