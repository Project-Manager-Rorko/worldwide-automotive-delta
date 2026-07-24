<?php
/**
 * Header — live Elementor clone (post-726) for pixel-accurate chrome.
 *
 * @package HelloElementorChild
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link screen-reader-text" href="#content"><?php esc_html_e( 'Skip to content', 'hello-elementor-child' ); ?></a>

<?php
if ( function_exists( 'wwa_live_clone_print_header' ) && wwa_live_clone_print_header() ) {
	return;
}

// Fallback approximate header if live fragment missing.
$logo_url = function_exists( 'wwa_get_logo_url' ) ? wwa_get_logo_url( 'color' ) : '';
$email    = 'info@worldwideautomotive.com';
$phone    = '+91 94808 49765, +96 6561416184';
?>
<header class="wwa-header" id="wwa-header">
	<div class="wwa-utility">
		<div class="wwa-utility__inner">
			<a class="wwa-utility__link" href="mailto:<?php echo esc_attr( $email ); ?>">
				<span class="wwa-utility__text"><?php echo esc_html( $email ); ?></span>
			</a>
			<a class="wwa-utility__link" href="tel:+919480849765">
				<span class="wwa-utility__text"><?php echo esc_html( $phone ); ?></span>
			</a>
		</div>
	</div>
	<div class="wwa-nav-bar">
		<div class="wwa-nav-bar__inner">
			<a class="wwa-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>">
				<?php if ( $logo_url ) : ?>
					<img src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" width="200" height="50" decoding="async">
				<?php else : ?>
					<?php bloginfo( 'name' ); ?>
				<?php endif; ?>
			</a>
			<nav class="wwa-primary-nav" id="wwa-primary-nav" aria-label="<?php esc_attr_e( 'Primary', 'hello-elementor-child' ); ?>">
				<?php
				if ( has_nav_menu( 'wwa-primary' ) ) {
					wp_nav_menu(
						array(
							'theme_location' => 'wwa-primary',
							'container'      => false,
							'menu_class'     => 'wwa-menu',
							'fallback_cb'    => false,
							'depth'          => 2,
						)
					);
				}
				?>
			</nav>
		</div>
	</div>
</header>
