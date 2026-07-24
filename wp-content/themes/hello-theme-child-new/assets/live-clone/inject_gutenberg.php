<?php
/**
 * Inject live-clone page fragment into Gutenberg Custom HTML block.
 * Usage (from public root with Local php.ini):
 *   php -c conf/php/cli-php.ini wp-content/themes/.../inject_gutenberg.php home
 *
 * Or: php inject_gutenberg.php --slug=home --path=/absolute/to/public
 */

// Resolve ABSPATH
$public = dirname( __DIR__, 5 ); // .../app/public from assets/live-clone
// assets/live-clone -> themes -> hello-theme-child-new -> themes -> wp-content -> public = 5 levels
// Path: public/wp-content/themes/hello-theme-child-new/assets/live-clone/inject_gutenberg.php
// dirname 1=live-clone, 2=assets, 3=theme, 4=themes, 5=wp-content, 6=public
$public = dirname( __DIR__, 5 );
if ( ! file_exists( $public . '/wp-load.php' ) ) {
	$public = 'C:/Users/shanm/Local Sites/wwa/app/public';
}

// Parse args
$slug = 'home';
foreach ( array_slice( $argv, 1 ) as $arg ) {
	if ( str_starts_with( $arg, '--slug=' ) ) {
		$slug = substr( $arg, 7 );
	} elseif ( ! str_starts_with( $arg, '-' ) ) {
		$slug = $arg;
	}
}

define( 'ABSPATH', trailingslashit_path( $public ) );

function trailingslashit_path( $p ) {
	return rtrim( str_replace( '\\', '/', $p ), '/' ) . '/';
}

// Bootstrap WP
require ABSPATH . 'wp-load.php';

if ( ! function_exists( 'wp_update_post' ) ) {
	fwrite( STDERR, "WP failed to load\n" );
	exit( 1 );
}

// Allow full HTML
kses_remove_all_filters();
if ( function_exists( 'kses_remove_filters' ) ) {
	kses_remove_filters();
}

$theme_dir = get_stylesheet_directory();
$frag_dir  = $theme_dir . '/assets/live-clone/fragments';

// Map slug -> fragment file + WP page finder
$slug_to_fragment = array(
	'home'                    => 'page-home.html',
	'about'                   => 'page-about.html',
	'leadership'              => 'page-leadership.html',
	'mini'                    => 'page-mini.html',
	'mini-excavators'         => 'page-mini.html',
	'wheel-loaders'           => 'page-wheel-loaders.html',
	'attachments'             => 'page-attachments.html',
	'construction-excavators' => 'page-construction-excavators.html',
	'mining-excavators'       => 'page-mining-excavators.html',
	'service-support'         => 'page-service-support.html',
	'refurbished-equipment'   => 'page-refurbished-equipment.html',
	'contact'                 => 'page-contact.html',
	'privacy-policy'          => 'page-privacy-policy.html',
	'terms-and-conditions'    => 'page-terms-and-conditions.html',
);

// Prefer gutenberg-* file if present
$frag_file = $frag_dir . '/gutenberg-' . $slug . '.html';
if ( ! file_exists( $frag_file ) ) {
	// try alias
	$base = isset( $slug_to_fragment[ $slug ] ) ? $slug_to_fragment[ $slug ] : "page-{$slug}.html";
	$raw  = $frag_dir . '/' . $base;
	// also try page-home for home
	if ( ! file_exists( $raw ) && 'home' === $slug ) {
		$raw = $frag_dir . '/page-home.html';
	}
	if ( ! file_exists( $raw ) ) {
		// try without gutenberg: page-{slug}
		$raw = $frag_dir . '/page-' . $slug . '.html';
	}
	if ( ! file_exists( $raw ) ) {
		fwrite( STDERR, "Fragment not found for {$slug}\n" );
		exit( 1 );
	}
	$html = file_get_contents( $raw );
	$content = "<!-- wp:html -->\n" . $html . "\n<!-- /wp:html -->\n";
} else {
	$content = file_get_contents( $frag_file );
}

// SEO from map
$map_file = $frag_dir . '/page-map-full.json';
$seo_title = '';
$seo_desc  = '';
if ( file_exists( $map_file ) ) {
	$map = json_decode( file_get_contents( $map_file ), true );
	if ( isset( $map[ $slug ]['title'] ) ) {
		$seo_title = $map[ $slug ]['title'];
	}
	if ( isset( $map[ $slug ]['description'] ) ) {
		$seo_desc = $map[ $slug ]['description'];
	}
}

// Find page
$page_id = 0;
if ( 'home' === $slug ) {
	$page_id = (int) get_option( 'page_on_front' );
	if ( ! $page_id ) {
		$p = get_page_by_path( 'home' );
		if ( $p ) {
			$page_id = (int) $p->ID;
		}
	}
} else {
	$p = get_page_by_path( $slug );
	if ( ! $p ) {
		// create page
		$page_id = wp_insert_post(
			array(
				'post_title'   => ucwords( str_replace( '-', ' ', $slug ) ),
				'post_name'    => $slug,
				'post_status'  => 'publish',
				'post_type'    => 'page',
				'post_content' => $content,
			),
			true
		);
		if ( is_wp_error( $page_id ) ) {
			fwrite( STDERR, $page_id->get_error_message() . "\n" );
			exit( 1 );
		}
		echo "Created page {$slug} ID={$page_id}\n";
	} else {
		$page_id = (int) $p->ID;
	}
}

if ( ! $page_id ) {
	fwrite( STDERR, "Could not resolve page for {$slug}\n" );
	exit( 1 );
}

// Update content — skip kses
remove_all_filters( 'content_save_pre' );
$result = wp_update_post(
	array(
		'ID'           => $page_id,
		'post_content' => $content,
	),
	true
);

if ( is_wp_error( $result ) ) {
	fwrite( STDERR, $result->get_error_message() . "\n" );
	exit( 1 );
}

// SEO via Yoast if available
if ( $seo_title ) {
	// Clean " - Site" suffix sometimes
	$yoast_title = $seo_title;
	update_post_meta( $page_id, '_yoast_wpseo_title', $yoast_title );
}
if ( $seo_desc ) {
	update_post_meta( $page_id, '_yoast_wpseo_metadesc', $seo_desc );
}

// Verify
$check = get_post( $page_id );
$has_block = ( strpos( $check->post_content, '<!-- wp:html -->' ) !== false );
$has_el    = ( strpos( $check->post_content, 'data-elementor-type="wp-page"' ) !== false );
$len       = strlen( $check->post_content );

echo "OK slug={$slug} ID={$page_id} len={$len} gutenberg={$has_block} elementor={$has_el}\n";
if ( $seo_title ) {
	echo "  title: {$seo_title}\n";
}
exit( 0 );
