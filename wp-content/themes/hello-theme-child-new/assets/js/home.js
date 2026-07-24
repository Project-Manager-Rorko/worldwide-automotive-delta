/**
 * WWA site JS — nav, hero video, mobile dropdowns.
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
			toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
		});

		// Mobile: tap parent with children toggles submenu; second tap / link goes through.
		nav.querySelectorAll('.menu-item-has-children > a').forEach(function (link) {
			link.addEventListener('click', function (e) {
				if (!window.matchMedia('(max-width: 1024px)').matches) {
					return; // desktop: hover handles submenu; allow navigation
				}
				var li = link.parentElement;
				if (!li.classList.contains('submenu-open')) {
					e.preventDefault();
					nav.querySelectorAll('.menu-item-has-children').forEach(function (other) {
						if (other !== li) other.classList.remove('submenu-open');
					});
					li.classList.add('submenu-open');
				}
				// if already open, allow default navigation to About / products parent URL
			});
		});

		nav.addEventListener('click', function (e) {
			var a = e.target.closest('a');
			if (!a) return;
			// Close drawer when following a real leaf link (no children or already open parent)
			var li = a.parentElement;
			var isParent = li && li.classList.contains('menu-item-has-children');
			var mobile = window.matchMedia('(max-width: 1024px)').matches;
			if (mobile && isParent && !li.classList.contains('submenu-open')) {
				return;
			}
			if (mobile && (!isParent || li.classList.contains('submenu-open'))) {
				// delay close so navigation can start
				setTimeout(function () {
					header.classList.remove('nav-open');
					toggle.setAttribute('aria-expanded', 'false');
				}, 50);
			}
		});
	}

	if (header) {
		var onScroll = function () {
			header.classList.toggle('is-scrolled', window.scrollY > 8);
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
	}

	// Hero video autoplay
	document.querySelectorAll('.wwa-hero__video, .wwa-hero__media video').forEach(function (v) {
		v.muted = true;
		v.defaultMuted = true;
		v.setAttribute('muted', '');
		v.setAttribute('playsinline', '');
		var tryPlay = function () {
			var p = v.play();
			if (p && p.catch) p.catch(function () {});
		};
		if (v.readyState >= 2) tryPlay();
		else {
			v.addEventListener('loadeddata', tryPlay, { once: true });
			v.addEventListener('canplay', tryPlay, { once: true });
		}
	});
})();
