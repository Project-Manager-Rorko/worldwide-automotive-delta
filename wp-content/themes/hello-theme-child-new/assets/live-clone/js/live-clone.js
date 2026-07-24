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
		qsa('.ekit-menu-hamburger, .elementskit-menu-hamburger, .ekit-nav-menu-icon').forEach(function (btn) {
			btn.addEventListener('click', function (e) {
				e.preventDefault();
				var wrap =
					btn.closest('.ekit-wid-con') ||
					btn.closest('.elementor-widget-elementskit-nav-menu') ||
					btn.parentElement;
				if (!wrap) return;
				wrap.classList.toggle('ekit-nav-menu-active');
				wrap.classList.toggle('active');
				document.documentElement.classList.toggle('ekit-menu-open');
				var panel = wrap.querySelector(
					'.elementskit-navbar-nav-default, .ekit-nav-menu, .elementskit-menu-container'
				);
				if (panel) {
					var open = panel.classList.toggle('active');
					panel.style.display = open ? 'block' : '';
				}
			});
		});

		qsa(
			'.elementskit-dropdown-has > a, .menu-item-has-children > a, .elementor-item-has-submenu'
		).forEach(function (link) {
			link.addEventListener('click', function (e) {
				if (window.innerWidth > 1024) return;
				var li = link.parentElement;
				if (!li) return;
				var sub = li.querySelector('.elementskit-dropdown, .sub-menu, .elementor-nav-menu--dropdown');
				if (!sub) return;
				e.preventDefault();
				li.classList.toggle('ekit-dropdown-open');
				sub.style.display = sub.style.display === 'block' ? 'none' : 'block';
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
