<?php
/**
 * Header — matches live Elementor header (post-726).
 * Full dark #1A1A2E bar: contact row + logo + white uppercase nav.
 *
 * @package HelloElementorChild
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$logo_url = wwa_get_logo_url( 'color' );
$email    = 'info@worldwideautomotive.com';
$phone    = '+91 94808 49765, +96 6561416184';
?>
<!DOCTYPE html>
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

<header class="wwa-header" id="wwa-header">
	<!-- Top contact strip (live hdr-menu-top) -->
	<div class="wwa-utility">
		<div class="wwa-utility__inner">
			<a class="wwa-utility__link" href="mailto:<?php echo esc_attr( $email ); ?>">
				<span class="wwa-utility__icon" aria-hidden="true">
					<svg width="22" height="22" viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.0813 4.41862H3.91854C2.7337 4.41862 1.77319 5.37912 1.77319 6.56397V19.436C1.77319 20.6209 2.7337 21.5814 3.91854 21.5814H21.0813C22.2661 21.5814 23.2266 20.6209 23.2266 19.436V6.56397C23.2266 5.37912 22.2661 4.41862 21.0813 4.41862Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M23.2266 7.63664L13.6048 13.7509C13.2736 13.9584 12.8907 14.0684 12.4999 14.0684C12.1091 14.0684 11.7262 13.9584 11.3951 13.7509L1.77319 7.63664" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</span>
				<span class="wwa-utility__text"><?php echo esc_html( $email ); ?></span>
			</a>
			<a class="wwa-utility__link" href="tel:+919480849765">
				<span class="wwa-utility__icon" aria-hidden="true">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 4h3l1.5 4-2 1.5a12 12 0 005.5 5.5L16 13.5l4 1.5v3A2 2 0 0118 20C10.5 20 4 13.5 4 6a2 2 0 012.5-2z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/></svg>
				</span>
				<span class="wwa-utility__text"><?php echo esc_html( $phone ); ?></span>
			</a>
		</div>
	</div>

	<!-- Main nav row (live also dark #1A1A2E) -->
	<div class="wwa-nav-bar">
		<div class="wwa-nav-bar__inner">
			<a class="wwa-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>">
				<img src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" width="200" height="50" decoding="async">
			</a>

			<button type="button" class="wwa-nav-toggle" id="wwa-nav-toggle" aria-controls="wwa-primary-nav" aria-expanded="false" aria-label="<?php esc_attr_e( 'Open menu', 'hello-elementor-child' ); ?>">
				<span class="wwa-nav-toggle__bar" aria-hidden="true"></span>
				<span class="wwa-nav-toggle__bar" aria-hidden="true"></span>
				<span class="wwa-nav-toggle__bar" aria-hidden="true"></span>
			</button>

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
				} else {
					?>
					<ul class="wwa-menu">
						<li class="menu-item menu-item-has-children">
							<a href="<?php echo esc_url( home_url( '/about/' ) ); ?>">Company</a>
							<ul class="sub-menu">
								<li><a href="<?php echo esc_url( home_url( '/about/' ) ); ?>">About</a></li>
								<li><a href="<?php echo esc_url( home_url( '/leadership/' ) ); ?>">Leadership</a></li>
							</ul>
						</li>
						<li class="menu-item menu-item-has-children">
							<a href="<?php echo esc_url( home_url( '/mini-excavators/' ) ); ?>">Products and attatchments</a>
							<ul class="sub-menu">
								<li><a href="<?php echo esc_url( home_url( '/mini-excavators/' ) ); ?>">Mini Excavators</a></li>
								<li><a href="<?php echo esc_url( home_url( '/wheel-loaders/' ) ); ?>">Wheel Loaders</a></li>
								<li><a href="<?php echo esc_url( home_url( '/attachments/' ) ); ?>">Attachments</a></li>
								<li><a href="<?php echo esc_url( home_url( '/mining-excavators/' ) ); ?>">Mining Excavators</a></li>
								<li><a href="<?php echo esc_url( home_url( '/construction-excavators/' ) ); ?>">Construction Excavators</a></li>
							</ul>
						</li>
						<li class="menu-item"><a href="<?php echo esc_url( home_url( '/service-support/' ) ); ?>">Services</a></li>
						<li class="menu-item"><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Contact us</a></li>
					</ul>
					<?php
				}
				?>
			</nav>
		</div>
	</div>
</header>
