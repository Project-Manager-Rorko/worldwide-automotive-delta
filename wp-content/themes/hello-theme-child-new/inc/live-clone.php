<?php
/**
 * Live-clone mode: inject exact Elementor HTML + CSS from vipaccounts.org/WWA
 * for pixel-accurate layouts without running Elementor.
 *
 * @package HelloElementorChild
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WWA_LIVE_CLONE_DIR', WWA_CHILD_DIR . '/assets/live-clone' );
define( 'WWA_LIVE_CLONE_URI', WWA_CHILD_URI . '/assets/live-clone' );
define( 'WWA_LIVE_CLONE_VER', '1.0.0' );

/**
 * Map local page slugs â†’ fragment basename + Elementor page CSS post ID(s).
 * Front page uses 'home'.
 */
function wwa_live_clone_page_map() {
	$popup_css = array( 2111, 2115, 3419, 2436, 2440, 3504 );

	$map = array(
		'home'                    => array(
			'fragment' => 'page-home',
			'css'      => array( 3616 ),
			'body'     => array( 'elementor-page', 'elementor-page-3616', 'page-id-3616' ),
		),
		'about'                   => array(
			'fragment' => 'page-about',
			'css'      => array_merge( array( 14 ), $popup_css ),
			'body'     => array( 'elementor-page', 'elementor-page-14' ),
		),
		'about-us'                => array(
			'fragment' => 'page-about',
			'css'      => array_merge( array( 14 ), $popup_css ),
			'body'     => array( 'elementor-page', 'elementor-page-14' ),
		),
		'leadership'              => array(
			'fragment' => 'page-leadership',
			'css'      => array( 1648 ),
			'body'     => array( 'elementor-page', 'elementor-page-1648' ),
		),
		'mini-excavators'         => array(
			'fragment' => 'page-mini',
			'css'      => array_merge( array( 1170 ), $popup_css ),
			'body'     => array( 'elementor-page', 'elementor-page-1170' ),
		),
		'wheel-loaders'           => array(
			'fragment' => 'page-wheel-loaders',
			'css'      => array_merge( array( 1348 ), $popup_css ),
			'body'     => array( 'elementor-page', 'elementor-page-1348' ),
		),
		'attachments'             => array(
			'fragment' => 'page-attachments',
			'css'      => array_merge( array( 1377 ), $popup_css ),
			'body'     => array( 'elementor-page', 'elementor-page-1377' ),
		),
		'construction-excavators' => array(
			'fragment' => 'page-construction-excavators',
			'css'      => array_merge( array( 1543 ), $popup_css ),
			'body'     => array( 'elementor-page', 'elementor-page-1543' ),
		),
		'mining-excavators'       => array(
			'fragment' => 'page-mining-excavators',
			'css'      => array_merge( array( 1397 ), $popup_css ),
			'body'     => array( 'elementor-page', 'elementor-page-1397' ),
		),
		'service-support'         => array(
			'fragment' => 'page-service-support',
			'css'      => array_merge( array( 1425 ), $popup_css ),
			'body'     => array( 'elementor-page', 'elementor-page-1425' ),
		),
		'services-supports'       => array(
			'fragment' => 'page-service-support',
			'css'      => array_merge( array( 1425 ), $popup_css ),
			'body'     => array( 'elementor-page', 'elementor-page-1425' ),
		),
		'contact'                 => array(
			'fragment' => 'page-contact',
			'css'      => array_merge( array( 21 ), $popup_css ),
			'body'     => array( 'elementor-page', 'elementor-page-21' ),
		),
		'refurbished-equipment'   => array(
			'fragment' => 'page-refurbished-equipment',
			'css'      => array_merge( array(), $popup_css ), // filled from scrape map
			'body'     => array( 'elementor-page' ),
		),
		'privacy-policy'          => array(
			'fragment' => 'page-privacy-policy',
			'css'      => array(),
			'body'     => array( 'elementor-page' ),
		),
		'terms-and-conditions'    => array(
			'fragment' => 'page-terms-and-conditions',
			'css'      => array(),
			'body'     => array( 'elementor-page' ),
		),
	);

	// Merge scrape maps (full overrides placeholders with real CSS IDs).
	foreach ( array( 'page-map-full.json', 'page-map-extra.json' ) as $map_name ) {
		$extra = WWA_LIVE_CLONE_DIR . '/fragments/' . $map_name;
		if ( ! file_exists( $extra ) ) {
			continue;
		}
		$data = json_decode( (string) file_get_contents( $extra ), true ); // phpcs:ignore
		if ( ! is_array( $data ) ) {
			continue;
		}
		foreach ( $data as $slug => $cfg ) {
			if ( ! is_array( $cfg ) ) {
				continue;
			}
			// Normalize keys from pipeline.
			$norm = array(
				'fragment' => isset( $cfg['fragment'] ) ? $cfg['fragment'] : ( 'page-' . $slug ),
				'css'      => isset( $cfg['css'] ) ? (array) $cfg['css'] : array(),
				'body'     => isset( $cfg['body'] ) ? (array) $cfg['body'] : array( 'elementor-page' ),
			);
			if ( isset( $cfg['page_id'] ) && $cfg['page_id'] ) {
				$pid = (int) $cfg['page_id'];
				if ( ! in_array( $pid, array_map( 'intval', $norm['css'] ), true ) ) {
					array_unshift( $norm['css'], $pid );
				}
				$norm['body'][] = 'elementor-page-' . $pid;
			}
			// Prefer scraped map entries (overwrite placeholders).
			$map[ $slug ] = $norm;
		}
	}

	return $map;
}

/**
 * Resolve clone config for current request, or null.
 */
function wwa_live_clone_current() {
	static $cached = null;
	if ( null !== $cached ) {
		return $cached;
	}

	$map = wwa_live_clone_page_map();

	if ( is_front_page() ) {
		$cached = isset( $map['home'] ) ? $map['home'] : null;
		return $cached;
	}

	if ( ! is_singular( 'page' ) ) {
		$cached = false;
		return null;
	}

	$slug = get_post_field( 'post_name', get_queried_object_id() );
	if ( $slug && isset( $map[ $slug ] ) ) {
		$cached = $map[ $slug ];
		return $cached;
	}

	// Also match by title-ish aliases.
	$aliases = array(
		'who-we-are' => 'about',
		'company'    => 'about',
	);
	if ( $slug && isset( $aliases[ $slug ] ) && isset( $map[ $aliases[ $slug ] ] ) ) {
		$cached = $map[ $aliases[ $slug ] ];
		return $cached;
	}

	$cached = false;
	return null;
}

function wwa_live_clone_enabled() {
	// Always use live header/footer; page body when mapped.
	return true;
}

function wwa_live_clone_has_page() {
	$cfg = wwa_live_clone_current();
	return is_array( $cfg ) && ! empty( $cfg['fragment'] );
}

/**
 * Read a fragment file; optionally re-base URLs to current home_url().
 */
function wwa_live_clone_rebase_urls( $html ) {
	$home = untrailingslashit( home_url() );
	return str_replace(
		array(
			'http://wwa.local',
			'https://wwa.local',
			'http:\\/\\/wwa.local',
			'https:\\/\\/wwa.local',
			'http://vipaccounts.org/WWA',
			'https://vipaccounts.org/WWA',
			'http:\\/\\/vipaccounts.org\\/WWA',
			'https:\\/\\/vipaccounts.org\\/WWA',
		),
		$home,
		$html
	);
}

function wwa_live_clone_get_fragment( $name ) {
	$path = WWA_LIVE_CLONE_DIR . '/fragments/' . $name . '.html';
	if ( ! file_exists( $path ) ) {
		return '';
	}
	$html = file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	if ( false === $html ) {
		return '';
	}

	$html = wwa_live_clone_rebase_urls( $html );

	if ( 'page-refurbished-equipment' === $name ) {
		$html = str_replace( '1800 209 8600', '+91 94808 49765', $html );
		$html = str_replace( 'href="#"', 'href="' . esc_url( home_url( '/contact/' ) ) . '"', $html );
	}

	if ( in_array( $name, array( 'page-about', 'gutenberg-about' ), true ) ) {
		$html = str_replace(
			array( 'ahmed-mohiuddin.png', 'shamil-ahmed.png', 'mohammed-shahzeer.png' ),
			array( 'leader-new1.webp', 'leader-new2.webp', 'leader-new3.webp' ),
			$html
		);
	}

	return $html;
}

/**
 * Enqueue exact live Elementor CSS stack (theme-local copies + uploads).
 */
function wwa_live_clone_enqueue_assets() {
	if ( is_admin() ) {
		return;
	}

	// Drop approximate custom chrome styles â€” live CSS replaces them.
	wp_dequeue_style( 'wwa-header-footer' );
	wp_dequeue_style( 'wwa-sections' );
	wp_dequeue_style( 'wwa-inner-pages' );
	wp_dequeue_style( 'hello-elementor-theme-style' );
	wp_dequeue_style( 'hello-elementor-header-footer' );

	$base = WWA_LIVE_CLONE_URI . '/css';
	$dir  = WWA_LIVE_CLONE_DIR . '/css';
	$ver  = WWA_LIVE_CLONE_VER;

	$core = array(
		'wwa-lc-reset'            => 'reset.css',
		'wwa-lc-theme'            => 'theme.css',
		'wwa-lc-frontend'         => 'frontend.min.css',
		'wwa-lc-custom-frontend'  => 'custom-frontend.min.css',
		'wwa-lc-post-6'           => 'post-6.css',
		'wwa-lc-post-726'         => 'post-726.css',
		'wwa-lc-post-737'         => 'post-737.css',
		'wwa-lc-heading'          => 'widget-heading.min.css',
		'wwa-lc-image'            => 'widget-image.min.css',
		'wwa-lc-icon-list'        => 'widget-icon-list.min.css',
		'wwa-lc-hfe'              => 'header-footer-elementor.css',
		'wwa-lc-fadein'           => 'fadeIn.min.css',
		'wwa-lc-fadeinup'         => 'fadeInUp.min.css',
	);

	$deps = array( 'wwa-tokens' );
	foreach ( $core as $handle => $file ) {
		$path = $dir . '/' . $file;
		if ( ! file_exists( $path ) ) {
			continue;
		}
		wp_enqueue_style( $handle, $base . '/' . $file, $deps, filemtime( $path ) );
		$deps = array( $handle );
	}

	// Nested accordion (product / service FAQ).
	$nested_acc = WP_CONTENT_DIR . '/plugins/elementor/assets/css/widget-nested-accordion.min.css';
	if ( file_exists( $nested_acc ) ) {
		wp_enqueue_style(
			'wwa-lc-nested-accordion',
			content_url( 'plugins/elementor/assets/css/widget-nested-accordion.min.css' ),
			$deps,
			filemtime( $nested_acc )
		);
		$deps = array( 'wwa-lc-nested-accordion' );
	}

	// Extra plugin CSS from live-clone/css/extra (non-font assets).
	$extra_dir = $dir . '/extra';
	$extra_uri = $base . '/extra';
	$extras    = array(
		'wwa-lc-divider'     => 'widget-divider.min.css',
		'wwa-lc-sticky'      => 'sticky.min.css',
		'wwa-lc-counter'     => 'widget-counter.min.css',
		'wwa-lc-posts'       => 'widget-posts.min.css',
		'wwa-lc-social'      => 'widget-social-icons.min.css',
		'wwa-lc-nav-menu'    => 'widget-nav-menu.min.css',
		'wwa-lc-ekit'        => 'ekit-widget-styles.css',
		'wwa-lc-ekit-resp'   => 'ekit-responsive.css',
		'wwa-lc-ekiticons'   => 'ekiticons.css',
		'wwa-lc-icon-list-c' => 'custom-widget-icon-list.min.css',
		'wwa-lc-hfe-widgets' => 'hfe-widgets-frontend.css',
		'wwa-lc-hello-hf'    => 'hello-header-footer.css',
		// Media carousel (refurbished equipment product photos).
		'wwa-lc-swiper'      => 'swiper.min.css',
		'wwa-lc-e-swiper'    => 'e-swiper.min.css',
		'wwa-lc-carousel-base' => 'widget-carousel-module-base.min.css',
		'wwa-lc-media-carousel' => 'widget-media-carousel.min.css',
	);
	foreach ( $extras as $handle => $file ) {
		$path = $extra_dir . '/' . $file;
		if ( ! file_exists( $path ) ) {
			continue;
		}
		wp_enqueue_style( $handle, $extra_uri . '/' . $file, $deps, filemtime( $path ) );
		$deps = array( $handle );
	}

	// Icon fonts from local plugin copies (correct relative webfont paths).
	$fa_base = WP_CONTENT_DIR . '/plugins/elementor/assets/lib';
	$fa_uri  = content_url( 'plugins/elementor/assets/lib' );
	$icon_css = array(
		'wwa-lc-eicons'    => $fa_base . '/eicons/css/elementor-icons.min.css',
		'wwa-lc-fa'        => $fa_base . '/font-awesome/css/fontawesome.css',
		'wwa-lc-fa-brands' => $fa_base . '/font-awesome/css/brands.css',
		'wwa-lc-fa-solid'  => $fa_base . '/font-awesome/css/solid.css',
	);
	foreach ( $icon_css as $handle => $path ) {
		if ( ! file_exists( $path ) ) {
			continue;
		}
		$rel = str_replace( WP_CONTENT_DIR, '', $path );
		$rel = str_replace( '\\', '/', $rel );
		wp_enqueue_style( $handle, content_url( ltrim( $rel, '/' ) ), $deps, filemtime( $path ) );
		$deps = array( $handle );
	}

	// Page-specific Elementor CSS (from theme live-clone or uploads).
	$cfg = wwa_live_clone_current();
	if ( is_array( $cfg ) && ! empty( $cfg['css'] ) ) {
		foreach ( (array) $cfg['css'] as $post_id ) {
			$post_id = (int) $post_id;
			$local   = $dir . '/post-' . $post_id . '.css';
			$upload  = WP_CONTENT_DIR . '/uploads/elementor/css/post-' . $post_id . '.css';
			if ( file_exists( $local ) ) {
				wp_enqueue_style(
					'wwa-lc-post-' . $post_id,
					$base . '/post-' . $post_id . '.css',
					$deps,
					filemtime( $local )
				);
			} elseif ( file_exists( $upload ) ) {
				wp_enqueue_style(
					'wwa-lc-post-' . $post_id,
					content_url( 'uploads/elementor/css/post-' . $post_id . '.css' ),
					$deps,
					filemtime( $upload )
				);
			}
			$deps = array( 'wwa-lc-post-' . $post_id );
		}
	} else {
		// Default: still load home page CSS lightly? Skip â€” only header/footer CSS.
		$home_css = $dir . '/post-3616.css';
		if ( is_front_page() && file_exists( $home_css ) ) {
			wp_enqueue_style( 'wwa-lc-post-3616', $base . '/post-3616.css', $deps, filemtime( $home_css ) );
		}
	}

	// Child style (fonts only).
	wp_enqueue_style(
		'hello-elementor-child-style',
		get_stylesheet_uri(),
		$deps,
		filemtime( WWA_CHILD_DIR . '/style.css' )
	);

	// Keep utilities minimal for full-bleed fixes only.
	wp_enqueue_style(
		'wwa-utilities',
		WWA_CHILD_URI . '/assets/css/utilities.css',
		array( 'hello-elementor-child-style' ),
		filemtime( WWA_CHILD_DIR . '/assets/css/utilities.css' )
	);

	// Live-clone bridge CSS (page-title hide, content width, AOS bootstrap).
	$bridge = WWA_LIVE_CLONE_DIR . '/css/live-bridge.css';
	if ( file_exists( $bridge ) ) {
		wp_enqueue_style(
			'wwa-lc-bridge',
			WWA_LIVE_CLONE_URI . '/css/live-bridge.css',
			array( 'wwa-utilities' ),
			filemtime( $bridge )
		);
	}

	// Full live child theme custom CSS (products, map, FAQ, footer, leadership popups).
	$live_custom = $dir . '/live-theme-custom.css';
	if ( file_exists( $live_custom ) ) {
		wp_enqueue_style(
			'wwa-lc-live-custom',
			$base . '/live-theme-custom.css',
			array( 'wwa-lc-bridge' ),
			filemtime( $live_custom )
		);
	}

	// Parity fixes: Geist-only, accordion, bio panel, footer, map canvas.
	$fixes = $dir . '/site-fixes.css';
	if ( file_exists( $fixes ) ) {
		wp_enqueue_style(
			'wwa-lc-site-fixes',
			$base . '/site-fixes.css',
			array( 'wwa-lc-live-custom' ),
			filemtime( $fixes )
		);
	}

		// Focused UI/UX refresh for the contact page and service CTA.
	$ui_refresh = $dir . '/ui-ux-refresh.css';
	if ( file_exists( $ui_refresh ) ) {
		wp_enqueue_style(
			'wwa-lc-ui-refresh',
			$base . '/ui-ux-refresh.css',
			array( 'wwa-lc-site-fixes' ),
			filemtime( $ui_refresh )
		);
	}

// Core jQuery must load before Elementor / ElementsKit (fixes "jQuery is not defined").
	wwa_live_clone_ensure_jquery();

	// Swiper only when a page actually has media carousels (refurbished listings).
	// Keeps other pages free of extra JS and avoids layout side-effects.
	$swiper_deps = array( 'jquery' );
	$swiper_js   = WWA_LIVE_CLONE_DIR . '/js/swiper.min.js';
	$post_id     = is_singular() ? (int) get_queried_object_id() : 0;
	$post_html   = $post_id ? (string) get_post_field( 'post_content', $post_id ) : '';
	$needs_swiper = is_page( 'refurbished-equipment' )
		|| ( $post_html && false !== strpos( $post_html, 'media-carousel' ) )
		|| ( $post_html && false !== strpos( $post_html, 'refurbished-equipment-media-slides' ) );
	if ( file_exists( $swiper_js ) && $needs_swiper ) {
		wp_enqueue_script(
			'wwa-swiper',
			WWA_LIVE_CLONE_URI . '/js/swiper.min.js',
			array( 'jquery' ),
			filemtime( $swiper_js ),
			array(
				'in_footer' => true,
			)
		);
		$swiper_deps[] = 'wwa-swiper';
	}

	// Interactive: mobile nav, counters, FAQ, leadership bio, video, carousels.
	$js = WWA_LIVE_CLONE_DIR . '/js/live-clone.js';
	if ( file_exists( $js ) ) {
		wp_enqueue_script(
			'wwa-live-clone',
			WWA_LIVE_CLONE_URI . '/js/live-clone.js',
			$swiper_deps,
			filemtime( $js ),
			array(
				'in_footer' => true,
			)
		);
	}

	// Global Presence fluid map (home).
	$fluid = WWA_LIVE_CLONE_DIR . '/js/fluid-map.js';
	if ( file_exists( $fluid ) && ( is_front_page() || is_page( 'home' ) ) ) {
		wp_enqueue_script(
			'wwa-fluid-map',
			WWA_LIVE_CLONE_URI . '/js/fluid-map.js',
			array( 'jquery' ),
			filemtime( $fluid ),
			array(
				'in_footer' => true,
			)
		);
	}

	// Dequeue old home.js if it fights live markup.
	wp_dequeue_script( 'wwa-site' );
}
add_action( 'wp_enqueue_scripts', 'wwa_live_clone_enqueue_assets', 100 );

/**
 * Ensure WordPress jQuery is registered and printed before Elementor/Ekit scripts.
 * Some Local/clone setups drop the jquery handle while still loading jquery-ui.
 */
function wwa_live_clone_ensure_jquery() {
	$jq = includes_url( 'js/jquery/jquery.min.js' );
	$jm = includes_url( 'js/jquery/jquery-migrate.min.js' );
	$imagesloaded = ABSPATH . WPINC . '/js/imagesloaded.min.js';
	$numerator   = WP_CONTENT_DIR . '/plugins/elementor/assets/lib/jquery-numerator/jquery-numerator.min.js';

	// Re-register core handles if missing or broken.
	if ( ! wp_script_is( 'jquery-core', 'registered' ) ) {
		wp_register_script( 'jquery-core', $jq, array(), '3.7.1', true );
	} else {
		// Force a real src if someone emptied it.
		$scripts = wp_scripts();
		if ( isset( $scripts->registered['jquery-core'] ) && empty( $scripts->registered['jquery-core']->src ) ) {
			$scripts->registered['jquery-core']->src = $jq;
		}
	}
	if ( ! wp_script_is( 'jquery-migrate', 'registered' ) ) {
		wp_register_script( 'jquery-migrate', $jm, array( 'jquery-core' ), '3.4.1', true );
	}
	if ( ! wp_script_is( 'jquery', 'registered' ) ) {
		wp_register_script( 'jquery', false, array( 'jquery-core', 'jquery-migrate' ), '3.7.1', true );
	}

	wp_enqueue_script( 'jquery' );
	wp_enqueue_script( 'jquery-core' );
	wp_enqueue_script( 'jquery-migrate' );
	if ( file_exists( $imagesloaded ) ) {
		wp_enqueue_script(
			'wwa-imagesloaded',
			includes_url( 'js/imagesloaded.min.js' ),
			array( 'jquery' ),
			filemtime( $imagesloaded ),
			false
		);
	}
	if ( file_exists( $numerator ) ) {
		wp_enqueue_script(
			'wwa-jquery-numerator',
			content_url( 'plugins/elementor/assets/lib/jquery-numerator/jquery-numerator.min.js' ),
			array( 'jquery' ),
			filemtime( $numerator ),
			false
		);
	}
}

// Early so plugin scripts that only declare jquery deps can resolve.
add_action( 'wp_enqueue_scripts', 'wwa_live_clone_ensure_jquery', 1 );

/**
 * Inject AOS / lazyload head styles from live site.
 */
function wwa_live_clone_head_extras() {
	$aos = WWA_LIVE_CLONE_DIR . '/fragments/aos-inline.css';
	if ( file_exists( $aos ) ) {
		echo '<style id="wwa-live-aos">' . file_get_contents( $aos ) . '</style>' . "\n"; // phpcs:ignore
		return;
	}
	// Fallback inline (from live head).
	?>
<style id="wwa-live-aos">
html:not(.elementor-editor-active) .aos-fade-up,
html:not(.elementor-editor-active) .img-wrapper-sma-new,
html:not(.elementor-editor-active) .img-wrapper-big-new,
html:not(.elementor-editor-active) .image-wrapper,
html:not(.elementor-editor-active) .integrate-cap-new-sec,
html:not(.elementor-editor-active) .aos-bg-fade-up > .elementor-background-overlay{
	opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s ease;
}
html:not(.elementor-editor-active) .aos-fade-up.aos-animate,
html:not(.elementor-editor-active) .img-wrapper-sma-new.aos-animate,
html:not(.elementor-editor-active) .img-wrapper-big-new.aos-animate,
html:not(.elementor-editor-active) .image-wrapper.aos-animate,
html:not(.elementor-editor-active) .integrate-cap-new-sec.aos-animate,
html:not(.elementor-editor-active) .aos-bg-fade-up.aos-animate > .elementor-background-overlay{
	opacity:1;transform:none;
}
.e-con.e-parent:nth-of-type(n+4):not(.e-lazyloaded):not(.e-no-lazyload),
.e-con.e-parent:nth-of-type(n+4):not(.e-lazyloaded):not(.e-no-lazyload) *{
	background-image:none!important;
}
.e-con.e-parent:nth-of-type(n+4):not(.e-lazyloaded):not(.e-no-lazyload){
	--background-image:none!important;
}
</style>
	<?php
}
add_action( 'wp_head', 'wwa_live_clone_head_extras', 20 );

/**
 * Body classes matching live Elementor page.
 */
function wwa_live_clone_body_class( $classes ) {
	$classes[] = 'elementor-default';
	$classes[] = 'elementor-kit-6';
	$classes[] = 'ehf-template-hello-elementor';
	$classes[] = 'ehf-stylesheet-hello-theme-child-new';
	$classes[] = 'hello-elementor-default';
	$classes[] = 'wwa-live-clone';

	$cfg = wwa_live_clone_current();
	if ( is_array( $cfg ) && ! empty( $cfg['body'] ) ) {
		foreach ( (array) $cfg['body'] as $c ) {
			$classes[] = $c;
		}
	}
	return $classes;
}
add_filter( 'body_class', 'wwa_live_clone_body_class', 20 );

/**
 * Disable wpautop / shortcode-ish mangling on clone pages.
 */
function wwa_live_clone_disable_content_filters() {
	if ( ! wwa_live_clone_has_page() ) {
		return;
	}
	remove_filter( 'the_content', 'wpautop' );
	remove_filter( 'the_content', 'shortcode_unautop' );
	remove_filter( 'the_content', 'wptexturize' );
	// Do not convert content chars inside Elementor HTML.
	remove_filter( 'the_content', 'convert_smilies', 20 );
}
add_action( 'wp', 'wwa_live_clone_disable_content_filters' );

/**
 * WordPress emits a malformed speculationrules tag in this cloned markup.
 * The site does not need speculative prefetching, so remove that optional
 * footer output rather than shipping invalid JavaScript to the browser.
 */
function wwa_live_clone_disable_speculation_rules() {
	remove_action( 'wp_footer', 'wp_print_speculation_rules' );
}
add_action( 'wp', 'wwa_live_clone_disable_speculation_rules', 1 );

/**
 * If post already has Gutenberg-injected Elementor HTML, leave it.
 * Otherwise fall back to live-clone fragment files.
 */
function wwa_live_clone_the_content( $content ) {
	if ( is_admin() || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}
	// Already exact clone in post_content (Gutenberg Custom HTML).
	if ( is_string( $content ) && (
		str_contains( $content, 'data-elementor-type="wp-page"' )
		|| str_contains( $content, 'elementor-location-' )
	) ) {
		return wwa_live_clone_rebase_urls( $content );
	}
	if ( ! wwa_live_clone_has_page() ) {
		return $content;
	}
	$cfg  = wwa_live_clone_current();
	$html = wwa_live_clone_get_fragment( $cfg['fragment'] );
	if ( '' === $html ) {
		return $content;
	}
	return $html;
}
add_filter( 'the_content', 'wwa_live_clone_the_content', 999 );

/**
 * Print live header markup.
 */
function wwa_live_clone_print_header() {
	$html = wwa_live_clone_get_fragment( 'header' );
	if ( $html ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- trusted local fragment from live scrape
		echo $html;
		return true;
	}
	return false;
}

/**
 * Print live footer markup.
 */
function wwa_live_clone_print_footer() {
	$html = wwa_live_clone_get_fragment( 'footer' );
	if ( $html ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $html;
		return true;
	}
	return false;
}
