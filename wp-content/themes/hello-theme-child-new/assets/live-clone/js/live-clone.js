/**
 * Live-clone interactions:
 * nav, AOS, lazy parents, video, counters, FAQ, leadership bio slides, sticky header
 */
(function () {
	'use strict';

	function qs(sel, root) {
		return (root || document).querySelector(sel);
	}
	function qsa(sel, root) {
		return Array.prototype.slice.call((root || document).querySelectorAll(sel));
	}

	function ready(fn) {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', fn);
		} else {
			fn();
		}
	}

	/* ---------- Nav / mobile ---------- */
	function initNav() {
		var currentPath = window.location.pathname.replace(/\/+$/, '') || '/';

		qsa('a[href]').forEach(function (link) {
			var href = link.getAttribute('href') || '';
			if (href.indexOf('/about/') !== -1) link.setAttribute('href', href.replace('/about/', '/about-us/'));
			if (href.charAt(0) === '#') return;
			if ((link.pathname.replace(/\/+$/, '') || '/') === currentPath) {
				link.classList.add('is-active');
				link.setAttribute('aria-current', 'page');
				var parent = link.closest('.elementskit-dropdown-has');
				if (parent) parent.classList.add('is-current-ancestor');
			}
		});
		qsa('img[src*="WWA-logo.svg"]').forEach(function (img) {
			img.setAttribute('alt', 'Worldwide Automotive');
		});
		qsa('header.elementor-location-header a').forEach(function (link) {
			if (!link.textContent.trim() && !link.querySelector('img,svg')) {
				link.remove();
			}
		});

		function syncHeaderLayout() {
			var pageMain = qs('body.wwa-live-clone main.site-main');
			if (pageMain) pageMain.style.setProperty('margin-top', window.innerWidth > 1024 ? '5px' : '0', 'important');
			qsa('header.elementor-location-header .hdr-menu-main').forEach(function (main) {
				var mobileLogo = main.querySelector(':scope > .elementor-element-e683956');
				var desktopLogo = main.querySelector(':scope > .elementor-element-fb79e5a');
				var menuItems = main.querySelector(':scope > .elementor-element-5af951e');
				var desktop = window.innerWidth > 1024;
				if (desktop) {
					main.style.setProperty('display', 'grid', 'important');
					main.style.setProperty('grid-template-columns', '240px minmax(0, 1fr)', 'important');
					main.style.setProperty('column-gap', '32px', 'important');
					if (mobileLogo) mobileLogo.style.setProperty('display', 'none', 'important');
					if (desktopLogo) {
						desktopLogo.style.setProperty('display', 'flex', 'important');
						desktopLogo.style.setProperty('width', '240px', 'important');
					}
					if (menuItems) {
						menuItems.style.setProperty('display', 'flex', 'important');
						menuItems.style.setProperty('width', '100%', 'important');
						menuItems.style.setProperty('justify-content', 'flex-end', 'important');
					}
				} else {
					main.style.setProperty('display', 'flex', 'important');
					main.style.setProperty('justify-content', 'space-between', 'important');
					main.style.setProperty('column-gap', '12px', 'important');
					if (mobileLogo) {
						mobileLogo.style.setProperty('display', 'flex', 'important');
						mobileLogo.style.setProperty('width', '100%', 'important');
						mobileLogo.style.setProperty('flex', '1 1 auto', 'important');
						mobileLogo.style.setProperty('height', '50px', 'important');
						var mobileLogoWidget = mobileLogo.querySelector('.elementor-element-47af525');
						var mobileLogoLink = mobileLogo.querySelector('a');
						var mobileLogoImage = mobileLogo.querySelector('img');
						if (mobileLogoWidget) {
							mobileLogoWidget.style.setProperty('display', 'flex', 'important');
							mobileLogoWidget.style.setProperty('height', '50px', 'important');
						}
						if (mobileLogoLink) {
							mobileLogoLink.style.setProperty('display', 'inline-flex', 'important');
							mobileLogoLink.style.setProperty('height', '50px', 'important');
						}
						if (mobileLogoImage) {
							mobileLogoImage.style.setProperty('display', 'block', 'important');
							mobileLogoImage.style.setProperty('width', '190px', 'important');
							mobileLogoImage.style.setProperty('height', 'auto', 'important');
						}
					}
					if (desktopLogo) desktopLogo.style.setProperty('display', 'none', 'important');
					if (menuItems) {
						menuItems.style.setProperty('display', 'flex', 'important');
						menuItems.style.setProperty('width', 'auto', 'important');
						menuItems.style.setProperty('margin-left', 'auto', 'important');
					}
				}
			});
		}
		syncHeaderLayout();
		window.addEventListener('resize', syncHeaderLayout, { passive: true });

		function focusables(root) {
			return qsa(
				'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
				root
			).filter(function (el) {
				return !el.hidden && el.offsetParent !== null;
			});
		}

		qsa('#ekit-megamenu-mobile-menu').forEach(function (panel) {
			var wrap = panel.closest('.ekit-wid-con') || panel.parentElement;
			var btn = wrap && wrap.querySelector('.elementskit-menu-hamburger, .ekit-menu-hamburger');
			var closeBtn = panel.querySelector('.elementskit-menu-close');
			var overlay = wrap && wrap.querySelector('.elementskit-menu-overlay');
			var list = panel.querySelector('#menu-mobile-menu');
			var activeButton = null;
			if (!wrap || !btn || !list) return;

			btn.setAttribute('aria-controls', panel.id);
			btn.setAttribute('aria-expanded', 'false');
			panel.setAttribute('role', 'dialog');
			panel.setAttribute('aria-modal', 'true');
			panel.setAttribute('aria-label', 'Mobile navigation');
			panel.hidden = true;
			panel.setAttribute('aria-hidden', 'true');
			if (overlay) overlay.hidden = true;

			if (!panel.querySelector('.wwa-mobile-actions')) {
				var actions = document.createElement('div');
				actions.className = 'wwa-mobile-actions';
				actions.innerHTML =
					'<a class="wwa-mobile-cta wwa-mobile-cta-primary" href="/contact/">Contact Us</a>' +
					'<a class="wwa-mobile-cta wwa-mobile-cta-secondary" href="mailto:info@worldwideautomotive.com">Email Us</a>';
				panel.appendChild(actions);
			}

			qsa('.elementskit-dropdown-has', list).forEach(function (item, index) {
				var toggle = item.querySelector(':scope > a.ekit-menu-nav-link');
				var sub = item.querySelector(':scope > .elementskit-megamenu-panel');
				if (!toggle || !sub) return;
				if (!sub.id) sub.id = 'wwa-mobile-panel-' + index;
				toggle.setAttribute('role', 'button');
				toggle.setAttribute('aria-controls', sub.id);
				toggle.setAttribute('aria-expanded', 'false');
				sub.hidden = true;
				toggle.addEventListener('click', function (e) {
					if (window.innerWidth > 1024) return;
					e.preventDefault();
					var open = !item.classList.contains('ekit-dropdown-open');
					qsa('.elementskit-dropdown-has.ekit-dropdown-open', list).forEach(function (other) {
						var otherToggle = other.querySelector(':scope > a.ekit-menu-nav-link');
						var otherSub = other.querySelector(':scope > .elementskit-megamenu-panel');
						other.classList.remove('ekit-dropdown-open', 'active', 'elementskit-open');
						if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');
						if (otherSub) otherSub.hidden = true;
					});
					item.classList.toggle('ekit-dropdown-open', open);
					item.classList.toggle('active', open);
					toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
					sub.hidden = !open;
				});
			});

			function closeMenu() {
				if (panel.hidden) return;
				panel.classList.remove('active');
				wrap.classList.remove('active', 'ekit-nav-menu-active');
				document.documentElement.classList.remove('ekit-menu-open');
				document.body.classList.remove('wwa-menu-lock');
				btn.setAttribute('aria-expanded', 'false');
				panel.setAttribute('aria-hidden', 'true');
				if (overlay) overlay.classList.remove('active');
				setTimeout(function () {
					panel.hidden = true;
					if (overlay) overlay.hidden = true;
					if (activeButton) activeButton.focus();
				}, 220);
			}

			function openMenu() {
				activeButton = document.activeElement;
				panel.hidden = false;
				if (overlay) overlay.hidden = false;
				requestAnimationFrame(function () {
					panel.classList.add('active');
					wrap.classList.add('active', 'ekit-nav-menu-active');
					document.documentElement.classList.add('ekit-menu-open');
					document.body.classList.add('wwa-menu-lock');
					btn.setAttribute('aria-expanded', 'true');
					panel.setAttribute('aria-hidden', 'false');
					if (overlay) overlay.classList.add('active');
					var first = closeBtn || focusables(panel)[0];
					if (first) first.focus();
				});
			}

			btn.addEventListener('click', function (e) {
				e.preventDefault();
				if (panel.hidden) openMenu();
				else closeMenu();
			});
			if (closeBtn) {
				closeBtn.addEventListener('click', function (e) {
					e.preventDefault();
					closeMenu();
				});
			}
			if (overlay) {
				overlay.addEventListener('click', function (e) {
					e.preventDefault();
					closeMenu();
				});
			}
			document.addEventListener('pointerdown', function (e) {
				if (panel.hidden || panel.contains(e.target) || btn.contains(e.target)) return;
				closeMenu();
			});
			document.addEventListener('keydown', function (e) {
				if (panel.hidden) return;
				if (e.key === 'Escape') {
					closeMenu();
					return;
				}
				if (e.key !== 'Tab') return;
				var items = focusables(panel);
				if (!items.length) return;
				var first = items[0];
				var last = items[items.length - 1];
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					last.focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			});
		});
	}

	/* ---------- AOS-like ---------- */
	function initAos() {
		var nodes = qsa(
			'.aos-fade-up, .img-wrapper-sma-new, .img-wrapper-big-new, .image-wrapper, .integrate-cap-new-sec, .aos-bg-fade-up'
		);
		if (!nodes.length || !('IntersectionObserver' in window)) {
			nodes.forEach(function (n) {
				n.classList.add('aos-animate');
			});
			return;
		}
		var io = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (en) {
					if (en.isIntersecting) {
						en.target.classList.add('aos-animate');
						io.unobserve(en.target);
					}
				});
			},
			{ rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
		);
		nodes.forEach(function (n) {
			io.observe(n);
		});
	}

	/* ---------- Lazy parent backgrounds ---------- */
	function initLazyParents() {
		var parents = qsa('.e-con.e-parent');
		if (!parents.length) return;
		if (!('IntersectionObserver' in window)) {
			parents.forEach(function (p) {
				p.classList.add('e-lazyloaded');
			});
			return;
		}
		var io = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (en) {
					if (en.isIntersecting) {
						en.target.classList.add('e-lazyloaded');
						io.unobserve(en.target);
					}
				});
			},
			{ rootMargin: '200px 0px' }
		);
		parents.forEach(function (p, i) {
			if (i < 3) {
				p.classList.add('e-lazyloaded');
			} else {
				io.observe(p);
			}
		});
	}

	/* ---------- Videos ---------- */
	function parseDataSettings(el) {
		var raw = el.getAttribute('data-settings');
		if (!raw) return null;
		try {
			var decoded = raw
				.replace(/&quot;/g, '"')
				.replace(/&#039;/g, "'")
				.replace(/&amp;/g, '&');
			return JSON.parse(decoded);
		} catch (e) {
			return null;
		}
	}

	function initVideos() {
		qsa('.elementor-background-video-hosted, video.elementor-background-video-hosted').forEach(function (v) {
			if (v.getAttribute('src')) return;
			var node = v.parentElement;
			var settings = null;
			for (var i = 0; i < 8 && node; i++) {
				settings = parseDataSettings(node);
				if (settings && settings.background_video_link) break;
				node = node.parentElement;
			}
			if (settings && settings.background_video_link) {
				v.setAttribute('src', settings.background_video_link);
				v.src = settings.background_video_link;
			}
		});

		qsa('video').forEach(function (v) {
			v.muted = true;
			v.defaultMuted = true;
			v.playsInline = true;
			v.loop = true;
			v.setAttribute('playsinline', '');
			v.setAttribute('muted', '');
			v.setAttribute('autoplay', '');
			v.setAttribute('loop', '');
			try {
				v.load();
			} catch (e) {}
			var p = v.play();
			if (p && typeof p.catch === 'function') {
				p.catch(function () {});
			}
		});
	}

	/* ---------- Counters (About operational impact) ---------- */
	function animateCounter(el, to, duration) {
		if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			el.textContent = String(to);
			return;
		}
		var start = 0;
		var startTime = null;
		var suffix = '';
		var prefix = '';
		var parent = el.closest('.elementor-counter');
		if (parent) {
			var pref = parent.querySelector('.elementor-counter-number-prefix');
			var suf = parent.querySelector('.elementor-counter-number-suffix');
			if (pref) prefix = pref.textContent || '';
			if (suf) suffix = suf.textContent || '';
		}
		function frame(ts) {
			if (!startTime) startTime = ts;
			var progress = Math.min((ts - startTime) / duration, 1);
			var eased = 1 - Math.pow(1 - progress, 3);
			var val = Math.floor(start + (to - start) * eased);
			el.textContent = String(val);
			if (progress < 1) {
				requestAnimationFrame(frame);
			} else {
				el.textContent = String(to);
			}
		}
		requestAnimationFrame(frame);
	}

	function initCounters() {
		var numbers = qsa('.elementor-counter-number');
		if (!numbers.length) return;

		function run(el) {
			if (el.dataset.wwaCounted) return;
			el.dataset.wwaCounted = '1';
			var to = parseFloat(el.getAttribute('data-to-value') || el.getAttribute('data-target') || el.textContent);
			if (isNaN(to)) to = 0;
			var duration = parseFloat(el.getAttribute('data-duration') || '2000');
			animateCounter(el, to, duration);
		}

		if (!('IntersectionObserver' in window)) {
			numbers.forEach(run);
			return;
		}
		var io = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (en) {
					if (en.isIntersecting) {
						run(en.target);
						io.unobserve(en.target);
					}
				});
			},
			{ threshold: 0.35 }
		);
		numbers.forEach(function (n) {
			io.observe(n);
		});
	}

	/* ---------- FAQ nested accordion — smooth open/close ---------- */
	function wrapAccordionPanel(item) {
		if (item.querySelector('.wwa-acc-panel')) return item.querySelector('.wwa-acc-panel');
		// Collect everything after <summary>
		var kids = Array.prototype.slice.call(item.children);
		var toWrap = [];
		kids.forEach(function (child) {
			if (child.tagName && child.tagName.toLowerCase() === 'summary') return;
			if (child.classList && child.classList.contains('e-n-accordion-item-title')) return;
			toWrap.push(child);
		});
		if (!toWrap.length) return null;
		var panel = document.createElement('div');
		panel.className = 'wwa-acc-panel';
		toWrap.forEach(function (n) {
			panel.appendChild(n);
		});
		item.appendChild(panel);
		return panel;
	}

	function openAccPanel(panel) {
		if (!panel) return;
		panel.style.maxHeight = 'none';
		var h = panel.scrollHeight;
		panel.style.maxHeight = '0px';
		panel.style.opacity = '0';
		// force reflow
		void panel.offsetHeight;
		panel.style.maxHeight = h + 40 + 'px';
		panel.style.opacity = '1';
		panel.style.paddingTop = '4px';
		panel.style.paddingBottom = '20px';
	}

	function closeAccPanel(panel) {
		if (!panel) return;
		panel.style.maxHeight = panel.scrollHeight + 'px';
		void panel.offsetHeight;
		panel.style.maxHeight = '0px';
		panel.style.opacity = '0';
		panel.style.paddingTop = '0px';
		panel.style.paddingBottom = '0px';
	}

	function initFaq() {
		qsa('.e-n-accordion-item').forEach(function (item) {
			var panel = wrapAccordionPanel(item);
			// Initial state
			if (panel) {
				if (item.open) {
					openAccPanel(panel);
					item.classList.add('is-open');
				} else {
					panel.style.maxHeight = '0px';
					panel.style.opacity = '0';
					panel.style.overflow = 'hidden';
					panel.style.transition =
						'max-height 0.45s ease, opacity 0.35s ease, padding 0.35s ease';
				}
			}

			item.addEventListener('toggle', function () {
				var p = item.querySelector('.wwa-acc-panel') || wrapAccordionPanel(item);
				if (item.open) {
					// close siblings
					var parent = item.parentElement;
					if (parent) {
						qsa('.e-n-accordion-item[open]', parent).forEach(function (other) {
							if (other !== item) {
								other.open = false;
								other.classList.remove('is-open');
								closeAccPanel(other.querySelector('.wwa-acc-panel'));
							}
						});
					}
					item.classList.add('is-open');
					openAccPanel(p);
				} else {
					item.classList.remove('is-open');
					closeAccPanel(p);
				}
			});
		});
	}

	/* ---------- Leadership bio slide panel ---------- */
	function decodePopupId(href) {
		if (!href) return null;
		try {
			var h = decodeURIComponent(href.replace(/^#/, ''));
			// elementor-action:action=popup:open&settings=BASE64
			var m = h.match(/settings[=:]([A-Za-z0-9+/=]+)/i);
			if (!m) {
				// fully encoded form
				var m2 = href.match(/settings%3D([A-Za-z0-9%]+)/i);
				if (m2) {
					var b64 = decodeURIComponent(m2[1]);
					var pad = '='.repeat((4 - (b64.length % 4)) % 4);
					var json = atob(b64 + pad);
					var data = JSON.parse(json);
					return data.id ? String(data.id) : null;
				}
				return null;
			}
			var b = m[1];
			var pad2 = '='.repeat((4 - (b.length % 4)) % 4);
			var j = atob(b + pad2);
			var d = JSON.parse(j);
			return d.id ? String(d.id) : null;
		} catch (e) {
			return null;
		}
	}

	function extractBioFromPopup(popupEl) {
		if (!popupEl) return null;
		var clone = popupEl.cloneNode(true);
		// strip images
		qsa('img, .elementor-widget-image, picture, video', clone).forEach(function (n) {
			n.remove();
		});
		qsa('[style*="background-image"]', clone).forEach(function (n) {
			n.style.backgroundImage = 'none';
		});
		var headings = qsa('h1,h2,h3,h4,h5,h6,.elementor-heading-title', clone);
		var name = headings[0] ? headings[0].textContent.trim() : '';
		var role = headings[1] ? headings[1].textContent.trim() : '';
		var paras = qsa('p, .elementor-text-editor', clone)
			.map(function (p) {
				return p.textContent.trim();
			})
			.filter(Boolean);
		// if headings used as text titles in bio body
		if (!paras.length && headings.length > 1) {
			paras = headings.slice(1).map(function (h) {
				return h.textContent.trim();
			});
			role = '';
		}
		return { name: name, role: role, body: paras.join('\n\n') };
	}

	function extractBioFromCard(btn) {
		var card =
			btn.closest('.popup-main-sec-blks') ||
			btn.closest('.e-con') ||
			btn.closest('.elementor-element');
		if (!card) return { name: '', role: '', body: '' };
		// walk up to card with headings
		var scope = card;
		for (var i = 0; i < 5 && scope; i++) {
			var heads = qsa('.elementor-heading-title, h1,h2,h3,h4,h5,h6', scope);
			if (heads.length >= 1) {
				var texts = heads.map(function (h) {
					return h.textContent.trim();
				});
				return {
					name: texts[0] || '',
					role: texts[1] || '',
					body: texts.slice(2).join('\n\n') || '',
				};
			}
			scope = scope.parentElement;
		}
		return { name: '', role: '', body: '' };
	}

	function openBioPanel(bio) {
		var existing = qs('.wwa-bio-overlay');
		if (existing) existing.remove();

		var overlay = document.createElement('div');
		overlay.className = 'wwa-bio-overlay';
		overlay.innerHTML =
			'<div class="wwa-bio-panel" role="dialog" aria-modal="true">' +
			'<button type="button" class="wwa-bio-close" aria-label="Close">&times;</button>' +
			'<h3></h3>' +
			'<p class="wwa-bio-role"></p>' +
			'<div class="wwa-bio-body"></div>' +
			'</div>';
		document.body.appendChild(overlay);
		document.body.style.overflow = 'hidden';

		var panel = qs('.wwa-bio-panel', overlay);
		qs('h3', panel).textContent = bio.name || 'Bio';
		var roleEl = qs('.wwa-bio-role', panel);
		if (bio.role) {
			roleEl.textContent = bio.role;
		} else {
			roleEl.style.display = 'none';
		}
		qs('.wwa-bio-body', panel).textContent = bio.body || '';

		// open: right -> left
		requestAnimationFrame(function () {
			overlay.classList.add('is-open');
		});

		function close() {
			// close: left -> right (panel slides out)
			overlay.classList.remove('is-open');
			panel.classList.add('is-closing');
			document.body.style.overflow = '';
			setTimeout(function () {
				overlay.remove();
			}, 400);
		}

		qs('.wwa-bio-close', panel).addEventListener('click', close);
		overlay.addEventListener('click', function (e) {
			if (e.target === overlay) close();
		});
		document.addEventListener(
			'keydown',
			function onKey(e) {
				if (e.key === 'Escape') {
					close();
					document.removeEventListener('keydown', onKey);
				}
			},
			{ once: false }
		);
	}

	function initLeadershipBio() {
		qsa('a.elementor-button, a.elementor-button-link').forEach(function (btn) {
			var label = (btn.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
			if (label.indexOf('read bio') === -1) return;

			btn.addEventListener('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				var href = btn.getAttribute('href') || '';
				var popupId = decodePopupId(href);
				var bio = null;
				if (popupId) {
					var popup = qs(
						'.elementor-' +
							popupId +
							'[data-elementor-type="popup"], [data-elementor-id="' +
							popupId +
							'"][data-elementor-type="popup"]'
					);
					bio = extractBioFromPopup(popup);
				}
				if (!bio || !bio.name) {
					bio = extractBioFromCard(btn);
				}
				// merge if popup had body only
				if (bio && !bio.body) {
					var fromCard = extractBioFromCard(btn);
					if (!bio.name) bio.name = fromCard.name;
					if (!bio.role) bio.role = fromCard.role;
				}
				openBioPanel(bio || { name: 'Bio', role: '', body: '' });
			});
		});
	}

	/* ---------- Sticky header class ---------- */
	function initStickyHeader() {
		var header = qs('header.elementor-location-header .hdr-menu-main, .hdr-menu-main');
		if (!header) header = qs('header.elementor-location-header');
		if (!header) return;
		var onScroll = function () {
			if (window.scrollY > 8) {
				header.classList.add('is-scrolled', 'sticky', 'fixed-header');
			} else {
				header.classList.remove('is-scrolled', 'sticky', 'fixed-header');
			}
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
	}

	/* ---------- Media carousels (refurbished product photos only) ---------- */
	function initMediaCarousels() {
		var carousels = qsa(
			'.elementor-widget-media-carousel .elementor-main-swiper.swiper, .refurbished-equipment-media-slides .elementor-main-swiper'
		);
		if (!carousels.length) return;

		function parseSettings(widget) {
			var raw = widget && widget.getAttribute('data-settings');
			if (!raw) return {};
			try {
				return JSON.parse(
					raw.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&')
				);
			} catch (e) {
				return {};
			}
		}

		function boot() {
			if (typeof window.Swiper === 'undefined') return;
			carousels.forEach(function (el) {
				if (el.swiper || el.classList.contains('swiper-initialized')) return;
				var widget = el.closest('.elementor-widget-media-carousel') || el.parentElement;
				var settings = parseSettings(widget);
				var nextBtn =
					el.querySelector('.elementor-swiper-button-next') ||
					(widget && widget.querySelector('.elementor-swiper-button-next'));
				var prevBtn =
					el.querySelector('.elementor-swiper-button-prev') ||
					(widget && widget.querySelector('.elementor-swiper-button-prev'));
				var speed = parseInt(settings.speed, 10) || 500;
				var autoplayOn = settings.autoplay !== 'no' && settings.autoplay !== false;
				var delay = parseInt(settings.autoplay_speed, 10) || 5000;
				var loopOn = settings.loop !== 'no' && settings.loop !== false;
				try {
					// eslint-disable-next-line no-new
					new window.Swiper(el, {
						slidesPerView: 1,
						spaceBetween: 10,
						loop: loopOn,
						speed: speed,
						watchOverflow: true,
						observer: true,
						observeParents: true,
						autoplay: autoplayOn
							? {
									delay: delay,
									disableOnInteraction: false,
									pauseOnMouseEnter: settings.pause_on_hover === 'yes',
							  }
							: false,
						navigation:
							nextBtn || prevBtn
								? {
										nextEl: nextBtn,
										prevEl: prevBtn,
								  }
								: undefined,
						allowTouchMove: true,
					});
				} catch (e) {
					// ignore init errors
				}
			});
		}

		if (typeof window.Swiper !== 'undefined') {
			boot();
		} else {
			var tries = 0;
			var t = setInterval(function () {
				tries += 1;
				if (typeof window.Swiper !== 'undefined' || tries > 50) {
					clearInterval(t);
					boot();
				}
			}, 100);
		}
	}

	ready(function () {
		initNav();
		initAos();
		initLazyParents();
		initVideos();
		initCounters();
		initFaq();
		initLeadershipBio();
		initStickyHeader();
		initMediaCarousels();
	});
})();
