<?php
$args = get_query_var('trx_addons_args_search');
?>
<div class="search_wrap search_style_<?php echo esc_attr( $args['style'] );
			if ( ! empty( $args['ajax'] ) ) echo ' search_ajax';
			if ( ! empty( $args['class'] ) ) echo ' ' . esc_attr( $args['class'] );
		?>"<?php
	if ( ! empty( $args['overlay_animation'] ) ) {
		echo ' data-overlay-animation="' . esc_attr( $args['overlay_animation'] ) . '"';
		echo ' data-overlay-animation-exit="' . esc_attr( $args['overlay_animation_exit'] ) . '"';
		if ( ! empty( $args['overlay_animation_duration'] ) ) {
			echo ' data-overlay-animation-duration="' . esc_attr( $args['overlay_animation_duration'] ) . '"';
		}
	}
?>>
	<div class="search_form_wrap">
		<form role="search" method="get" class="search_form" action="<?php echo esc_url( apply_filters( 'trx_addons_filter_search_form_url', home_url( '/' ) ) ); ?>">
			<input type="hidden" value="<?php
				if (!empty($args['post_types'])) {
					echo esc_attr( is_array($args['post_types']) ? join(',', $args['post_types']) : $args['post_types'] );
				}
			?>" name="post_types">
			<input type="text" class="search_field" placeholder="<?php echo ! empty( $args['placeholder_text'] ) ? $args['placeholder_text'] : ''; ?>" value="<?php echo esc_attr(get_search_query()); ?>" name="s">
			<button type="submit" class="search_submit <?php echo ! empty( $args['icon'] ) ? $args['icon'] : 'trx_addons_icon-search'; ?>" aria-label="<?php esc_attr_e( 'Start search', 'trx_addons' ); ?>"></button>
			<?php if ( $args['style'] == 'fullscreen' ) { ?>
				<a class="search_close <?php echo ! empty( $args['icon_close'] ) ? $args['icon_close'] : 'trx_addons_icon-delete'; ?>"><?php
					if ( ! empty( $args['close_label_text'] ) ) {
						?><span class="search_close_label"><?php echo esc_html( $args['close_label_text'] ); ?></span><?php
					}
				?></a>
			<?php } ?>
		</form>
	</div>
	<?php
	if ( ! empty( $args['ajax'] ) ) {
		?><div class="search_results widget_area"><a href="#" class="search_results_close trx_addons_icon-cancel"></a><div class="search_results_content"></div></div><?php
	}
	?>
</div>