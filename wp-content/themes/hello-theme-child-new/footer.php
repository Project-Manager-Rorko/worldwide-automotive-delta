<?php
/**
 * Footer — live Elementor clone (post-737) for pixel-accurate chrome.
 *
 * @package HelloElementorChild
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( function_exists( 'wwa_live_clone_print_footer' ) ) {
	wwa_live_clone_print_footer();
} else {
	?>
	<footer class="wwa-footer" id="wwa-footer">
		<div class="wwa-footer__shell">
			<p class="wwa-footer__copy">&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> Worldwide Automotive.</p>
		</div>
	</footer>
	<?php
}

// Site-wide Elementor popups (Connect forms, etc.) for live parity.
if ( function_exists( 'wwa_live_clone_get_fragment' ) ) {
	$popups = wwa_live_clone_get_fragment( 'popups' );
	if ( $popups ) {
		// Keep popup source markup available to the lightweight leadership bio reader.
		$popups = str_replace( 'data-elementor-type="popup"', 'data-wwa-bio-source="true"', $popups );
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $popups;
	}
}

wp_footer();
?>
</body>
</html>
