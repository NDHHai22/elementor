"use strict";
jQuery( document ).ready( function() {
	if ( typeof elementorFrontend == 'undefined' ) {
		return;
	}
	// Add animation for the SVG paths after the timeout to allow the animation script breaks the text into words or chars
	setTimeout( function() {
		if ( ! elementorFrontend.isEditMode() ) {
			// Paint in Frontend only after the element comes into the view
			jQuery( '.elementor-widget-trx_elm_advanced_title.trx-addons-animate .trx-addons-advanced-title').each( function() {
				var $self = jQuery( this ),
					delay = $self.data( 'delay' ) || 0;
				$self.find( '.trx-addons-svg-wrapper path' ).each( function( idx ) {
					var $path = jQuery( this );
					trx_addons_intersection_observer_add( $path, function( item, enter ) {
						if ( enter ) {
							trx_addons_intersection_observer_remove( item );
							if ( ! $path.hasClass( 'trx-addons-animate-complete' ) ) {
								$path.addClass( 'trx-addons-animate-complete' );
								setTimeout( function() {
									$path.css( 'animation-play-state', 'running' );
								}, 300 * idx + 400 + parseInt( delay ) );
							}
						}
					} );
				} );
			} );
		} else {
			// Repaint after the elementor is changed in the Editor
			elementorFrontend.hooks.addAction( 'frontend/element_ready/global', function( $cont ) {
				$cont.find( '.trx-addons-advanced-title' ).each( function() {
					var $self = jQuery( this ),
						delay = $self.data( 'delay' ) || 0;
					$self.find( '.trx-addons-svg-wrapper path' ).each( function( idx ) {
						var $path = jQuery( this );
						setTimeout( function() {
							$path.css( 'animation-play-state', 'running' );
						}, 300 * idx + 400 + parseInt( delay ) );
					} );
				} );
			} );
		}
	}, 100 );
} );