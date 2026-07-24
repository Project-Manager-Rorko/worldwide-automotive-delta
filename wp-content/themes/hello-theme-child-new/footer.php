<?php
/**
 * WWA footer — live site structure & copy.
 *
 * @package HelloElementorChild
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$logo_url = wwa_get_logo_url( 'color' );
?>

<footer class="wwa-footer" id="wwa-footer">
	<div class="wwa-footer__shell">
		<div class="wwa-footer__cta-row">
			<a class="wwa-footer__logo" href="<?php echo esc_url( home_url( '/' ) ); ?>">
				<img src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" width="180" height="48" loading="lazy" decoding="async">
			</a>
			<p class="wwa-footer__blurb">Built on an execution-driven approach, Delta Group focuses on delivering reliable operations, scalable solutions, and long-term value for clients and partners.</p>
			<a class="wwa-btn wwa-btn--primary" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Connect With Team</a>
		</div>

		<div class="wwa-footer__cols">
			<div class="wwa-footer__col">
				<h2 class="wwa-footer__heading">Quick Links</h2>
				<ul class="wwa-footer__list">
					<li><a href="<?php echo esc_url( home_url( '/about/' ) ); ?>">Who we are</a></li>
					<li><a href="<?php echo esc_url( home_url( '/leadership/' ) ); ?>">Leadership</a></li>
					<li><a href="<?php echo esc_url( home_url( '/service-support/' ) ); ?>">Services &amp; Supports</a></li>
				</ul>
			</div>
			<div class="wwa-footer__col">
				<h2 class="wwa-footer__heading">Our Businesses</h2>
				<ul class="wwa-footer__list">
					<li><a href="<?php echo esc_url( home_url( '/mini-excavators/' ) ); ?>">Mini Excavators</a></li>
					<li><a href="<?php echo esc_url( home_url( '/wheel-loaders/' ) ); ?>">Wheel Loaders</a></li>
					<li><a href="<?php echo esc_url( home_url( '/attachments/' ) ); ?>">Excavator Attachment</a></li>
					<li><a href="<?php echo esc_url( home_url( '/construction-excavators/' ) ); ?>">Construction Excavators</a></li>
					<li><a href="<?php echo esc_url( home_url( '/mining-excavators/' ) ); ?>">Mining Excavators</a></li>
				</ul>
			</div>
			<div class="wwa-footer__col">
				<h2 class="wwa-footer__heading">Contact Us</h2>
				<ul class="wwa-footer__contact">
					<li>
						<span class="wwa-footer__contact-icon" aria-hidden="true">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="1.6"/></svg>
						</span>
						<span>Delta House, 6th Floor, Bangra-Kulur Road, Dakshina Kannada District, Kulur, Mangalore-575013, Karnataka, India</span>
					</li>
					<li>
						<span class="wwa-footer__contact-icon" aria-hidden="true">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 4h3l1.5 4-2 1.5a12 12 0 005.5 5.5L16 13.5l4 1.5v3A2 2 0 0118 20C10.5 20 4 13.5 4 6a2 2 0 012.5-2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
						</span>
						<span><a href="tel:+919480849765">+91 94808 49765</a>, <a href="tel:+966561416184">+96 6561416184</a></span>
					</li>
					<li>
						<span class="wwa-footer__contact-icon" aria-hidden="true">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16v12H4V6zm0 0l8 7 8-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
						</span>
						<a href="mailto:info@worldwideautomotive.com">info@worldwideautomotive.com</a>
					</li>
				</ul>
			</div>
		</div>

		<div class="wwa-footer__bottom">
			<p class="wwa-footer__copy">&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> Worldwide Automotive. All rights reserved.</p>
			<div class="wwa-footer__legal">
				<a href="<?php echo esc_url( home_url( '/privacy-policy/' ) ); ?>">Privacy Policy</a>
				<a href="<?php echo esc_url( home_url( '/terms-and-conditions/' ) ); ?>">Terms &amp; Conditions</a>
			</div>
		</div>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
