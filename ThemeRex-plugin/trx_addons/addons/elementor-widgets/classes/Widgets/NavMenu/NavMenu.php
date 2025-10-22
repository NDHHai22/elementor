<?php
/**
 * NavMenu Module
 *
 * @package ThemeREX Addons
 * @since v2.30.0
 */

namespace TrxAddons\ElementorWidgets\Widgets\NavMenu;

use TrxAddons\ElementorWidgets\BaseWidgetModule;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * NavMenu module
 */
class NavMenu extends BaseWidgetModule {

	/**
	 * Constructor.
	 *
	 * Initializing the module base class.
	 */
	public function __construct() {
		parent::__construct();

		$this->assets = array(
			'css' => true,
			'js'  => true,
			'lib' => array(
				// 'js' => array(
				// 	'lottie' => array( 'src' => 'lottie/lottie.js' ),		// Lottie anumations
				// ),
				'css' => array(
					'font-awesome-5-all' => true,
				)
			)
		);
	}

	/**
	 * Get the name of the module
	 *
	 * @return string  The name of the module.
	 */
	public function get_name() {
		return 'nav-menu';
	}

	/**
	 * Get the selector for the animation type 'Item by item'
	 * 
	 * @return string  The selector of the single item.
	 */
	public function get_separate_animation_selector() {
		return '.trx-addons-nav-menu > .menu-item';
	}
}
