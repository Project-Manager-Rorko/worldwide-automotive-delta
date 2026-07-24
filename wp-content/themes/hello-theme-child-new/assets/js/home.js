/**
 * WWA site JS — mobile nav, sticky header, hero video play.
 */
(function () {
	'use strict';

	var header = document.getElementById('wwa-header');
	var toggle = document.getElementById('wwa-nav-toggle');
	var nav = document.getElementById('wwa-primary-nav');

	if (toggle && header && nav) {
		toggle.addEventListener('click', function () {
			var open = header.classList.toggle('nav-open');
			toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
			toggle.setAttribute(
				'aria-label',
				open ? 'Close menu' : 'Open menu'
			);
		});

		nav.addEventListener('click', function (e) {
			if (e.target.closest('a') && window.matchMedia('(max-width: 1023px)').matches) {
				header.classList.remove('nav-open');
				toggle.setAttribute('aria-expanded', 'false');
			}
		});
	}

	if (header) {
		var onScroll = function () {
			if (window.scrollY > 8) {
				header.classList.add('is-scrolled');
			} else {
				header.classList.remove('is-scrolled');
			}
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
	}

	// Force hero background video to play (browser autoplay policies).
	var vids = document.querySelectorAll('.wwa-hero__video, .wwa-hero__media video');
	vids.forEach(function (v) {
		v.muted = true;
		v.setAttribute('muted', '');
		v.setAttribute('playsinline', '');
		var tryPlay = function () {
			var p = v.play();
			if (p && typeof p.catch === 'function') {
				p.catch(function () {
					/* ignore autoplay block */
				});
			}
		};
		if (v.readyState >= 2) {
			tryPlay();
		} else {
			v.addEventListener('loadeddata', tryPlay, { once: true });
			v.addEventListener('canplay', tryPlay, { once: true });
		}
	});
})();
