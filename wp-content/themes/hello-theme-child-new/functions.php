<?php
/**
 * Hello Elementor Child — Worldwide Automotive.
 *
 * Gutenberg body + custom header/footer. No Elementor dependency.
 *
 * @package HelloElementorChild
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WWA_CHILD_VERSION', '7.0.0' );
define( 'WWA_CHILD_DIR', get_stylesheet_directory() );
define( 'WWA_CHILD_URI', get_stylesheet_directory_uri() );

/**
 * Theme supports & menus.
 */
function wwa_child_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'custom-logo', array(
		'height'      => 80,
		'width'       => 240,
		'flex-height' => true,
		'flex-width'  => true,
	) );
	add_theme_support(
		'html5',
		array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' )
	);

	register_nav_menus(
		array(
			'wwa-primary'         => __( 'Primary Navigation', 'hello-elementor-child' ),
			'wwa-footer-quick'    => __( 'Footer Quick Links', 'hello-elementor-child' ),
			'wwa-footer-business' => __( 'Footer Our Businesses', 'hello-elementor-child' ),
		)
	);
}
add_action( 'after_setup_theme', 'wwa_child_setup' );

/**
 * Enqueue styles & scripts.
 */
function wwa_child_assets() {
	// Soften Hello parent layout on WWA pages (we provide our own chrome + home CSS).
	wp_dequeue_style( 'hello-elementor-theme-style' );
	wp_dequeue_style( 'hello-elementor-header-footer' );

	wp_enqueue_style(
		'wwa-tokens',
		WWA_CHILD_URI . '/assets/css/tokens.css',
		array(),
		filemtime( WWA_CHILD_DIR . '/assets/css/tokens.css' )
	);

	wp_enqueue_style(
		'wwa-utilities',
		WWA_CHILD_URI . '/assets/css/utilities.css',
		array( 'wwa-tokens' ),
		filemtime( WWA_CHILD_DIR . '/assets/css/utilities.css' )
	);

	wp_enqueue_style(
		'wwa-header-footer',
		WWA_CHILD_URI . '/assets/css/header-footer.css',
		array( 'wwa-utilities' ),
		filemtime( WWA_CHILD_DIR . '/assets/css/header-footer.css' )
	);

	// Child style.css = theme header + @font-face only.
	wp_enqueue_style(
		'hello-elementor-child-style',
		get_stylesheet_uri(),
		array( 'wwa-header-footer' ),
		filemtime( WWA_CHILD_DIR . '/style.css' )
	);

	// Section styles for home + inner pages (class-driven Gutenberg wrappers).
	wp_enqueue_style(
		'wwa-sections',
		WWA_CHILD_URI . '/assets/css/home.css',
		array( 'hello-elementor-child-style' ),
		filemtime( WWA_CHILD_DIR . '/assets/css/home.css' )
	);

	$inner = WWA_CHILD_DIR . '/assets/css/inner-pages.css';
	if ( file_exists( $inner ) ) {
		wp_enqueue_style(
			'wwa-inner-pages',
			WWA_CHILD_URI . '/assets/css/inner-pages.css',
			array( 'wwa-sections' ),
			filemtime( $inner )
		);
	}

	wp_enqueue_script(
		'wwa-site',
		WWA_CHILD_URI . '/assets/js/home.js',
		array(),
		filemtime( WWA_CHILD_DIR . '/assets/js/home.js' ),
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);
}
add_action( 'wp_enqueue_scripts', 'wwa_child_assets', 20 );

/**
 * Editor styles so backend matches front (Geist + tokens).
 */
function wwa_child_editor_assets() {
	wp_enqueue_style(
		'wwa-tokens-editor',
		WWA_CHILD_URI . '/assets/css/tokens.css',
		array(),
		filemtime( WWA_CHILD_DIR . '/assets/css/tokens.css' )
	);
	wp_enqueue_style(
		'wwa-child-editor-font',
		get_stylesheet_uri(),
		array( 'wwa-tokens-editor' ),
		filemtime( WWA_CHILD_DIR . '/style.css' )
	);
	add_editor_style( 'assets/css/tokens.css' );
	add_editor_style( 'style.css' );
	add_editor_style( 'assets/css/home.css' );
}
add_action( 'after_setup_theme', function () {
	add_theme_support( 'editor-styles' );
}, 11 );
add_action( 'enqueue_block_editor_assets', 'wwa_child_editor_assets' );

/**
 * Preload primary Geist weight.
 */
function wwa_child_preload_fonts() {
	$href = WWA_CHILD_URI . '/assets/fonts/Geist-Regular.woff2';
	echo '<link rel="preload" href="' . esc_url( $href ) . '" as="font" type="font/woff2" crossorigin>' . "\n";
}
add_action( 'wp_head', 'wwa_child_preload_fonts', 1 );

/**
 * Body classes.
 */
function wwa_child_body_class( $classes ) {
	$classes[] = 'wwa-site';
	if ( is_front_page() ) {
		$classes[] = 'wwa-home';
	}
	return $classes;
}
add_filter( 'body_class', 'wwa_child_body_class' );

/**
 * Hide Hello default page titles — H1 lives in Gutenberg hero/content.
 */
function wwa_child_hide_page_title( $show ) {
	if ( is_singular( 'page' ) ) {
		return false;
	}
	return $show;
}
add_filter( 'hello_elementor_page_title', 'wwa_child_hide_page_title' );

/**
 * Performance: disable emoji scripts & unused Hello chrome.
 */
function wwa_child_perf() {
	remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
	remove_action( 'wp_print_styles', 'print_emoji_styles' );
	remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
	remove_action( 'admin_print_styles', 'print_emoji_styles' );
	wp_dequeue_style( 'wp-block-library-theme' );
}
add_action( 'init', 'wwa_child_perf' );

/**
 * Allow SVG uploads.
 */
function wwa_child_mime_types( $mimes ) {
	$mimes['svg']  = 'image/svg+xml';
	$mimes['webp'] = 'image/webp';
	return $mimes;
}
add_filter( 'upload_mimes', 'wwa_child_mime_types' );

/**
 * Logo URL helper — custom logo or fallback attachment / media path.
 */
function wwa_get_logo_url( $variant = 'color' ) {
	$custom = get_theme_mod( 'custom_logo' );
	if ( $custom ) {
		$url = wp_get_attachment_image_url( (int) $custom, 'full' );
		if ( $url ) {
			return $url;
		}
	}

	// Fallbacks from Media Library imports (IDs may vary; prefer URL scan).
	$filename = ( 'black' === $variant ) ? 'WWA-logo-black.svg' : 'WWA-logo.svg';
	$upload   = wp_upload_dir();
	$candidate = trailingslashit( $upload['baseurl'] ) . '2026/07/' . $filename;
	return $candidate;
}
