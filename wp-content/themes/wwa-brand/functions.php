<?php
/**
 * WWA Brand — Twenty Twenty-Five child.
 *
 * Fonts + tokens only. Do not add page templates or PHP patterns here.
 * Build pages in Pages → Edit (Gutenberg) and chrome in Appearance → Editor.
 *
 * @package WWA_Brand
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WWA_BRAND_VERSION', '1.0.0' );

/**
 * Enqueue child stylesheet after parent.
 */
function wwa_brand_enqueue_styles() {
	wp_enqueue_style(
		'wwa-brand-style',
		get_stylesheet_uri(),
		array( 'twentytwentyfive-style' ),
		WWA_BRAND_VERSION
	);

	$home_css = get_stylesheet_directory() . '/assets/css/editor-helpers.css';
	if ( file_exists( $home_css ) ) {
		wp_enqueue_style(
			'wwa-brand-helpers',
			get_stylesheet_directory_uri() . '/assets/css/editor-helpers.css',
			array( 'wwa-brand-style' ),
			filemtime( $home_css )
		);
	}
}
add_action( 'wp_enqueue_scripts', 'wwa_brand_enqueue_styles', 20 );

/**
 * Allow SVG uploads for the logo.
 */
function wwa_brand_mime_types( $mimes ) {
	$mimes['svg'] = 'image/svg+xml';
	return $mimes;
}
add_filter( 'upload_mimes', 'wwa_brand_mime_types' );

/**
 * Site title defaults (can be changed in Settings).
 */
function wwa_brand_after_setup() {
	add_theme_support( 'editor-styles' );
}
add_action( 'after_setup_theme', 'wwa_brand_after_setup' );
