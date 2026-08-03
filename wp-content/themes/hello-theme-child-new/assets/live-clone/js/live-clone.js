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

	/* ---------- Nav / mobile (+ mega-menu open/close) ---------- */
	function initNav() {
		function isDesktop() {
			return window.innerWidth > 1024;
		}

		function getMegaPanel(li) {
			if (!li) return null;
			var kids = li.children;
			var i;
			for (i = 0; i < kids.length; i++) {
				if (
					kids[i].classList &&
					(kids[i].classList.contains('elementskit-megamenu-panel') ||
						kids[i].classList.contains('elementskit-dropdown') ||
						kids[i].classList.contains('sub-menu'))
				) {
					return kids[i];
				}
			}
			return (
				li.querySelector('.elementskit-megamenu-panel') ||
				li.querySelector('.elementskit-dropdown, .sub-menu, .elementor-nav-menu--dropdown')
			);
		}

		function closeSub(li) {
			if (!li) return;
			li.classList.remove(
				'active',
				'elementskit-open',
				'ekit-dropdown-open',
				'wwa-sub-open'
			);
			var sub = getMegaPanel(li);
			if (sub && !sub.classList.contains('elementskit-megamenu-panel')) {
				sub.style.display = 'none';
			}
		}

		function openSub(li) {
			if (!li) return;
			li.classList.add('active', 'elementskit-open', 'ekit-dropdown-open', 'wwa-sub-open');
			var sub = getMegaPanel(li);
			if (sub && !sub.classList.contains('elementskit-megamenu-panel')) {
				sub.style.display = 'block';
			}
		}

		function closeSiblingSubs(li) {
			var list = li && li.parentElement;
			if (!list) return;
			Array.prototype.forEach.call(list.children, function (sib) {
				if (sib === li) return;
				if (
					sib.classList &&
					(sib.classList.contains('elementskit-dropdown-has') ||
						sib.classList.contains('menu-item-has-children'))
				) {
					closeSub(sib);
				}
			});
		}

		// Hamburger
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
				if (!wrap.classList.contains('active')) {
					qsa(
						'.elementskit-dropdown-has, .menu-item-has-children',
						wrap
					).forEach(closeSub);
				}
			});
		});

		// Parent items with mega panels / dropdowns
		qsa(
			'header.elementor-location-header .elementskit-dropdown-has > a, header.elementor-location-header .menu-item-has-children > a'
		).forEach(function (link) {
			var li = link.parentElement;
			if (!li || !getMegaPanel(li)) return;

			// Desktop: click toggles open (backup when pure hover fails); hover still works via CSS
			link.addEventListener('click', function (e) {
				var href = (link.getAttribute('href') || '').trim();
				var isHash = !href || href === '#' || href === '#!' || href.indexOf('javascript:') === 0;

				if (isDesktop()) {
					// Only intercept placeholder parents; real URLs still navigate
					if (!isHash) return;
					e.preventDefault();
					e.stopPropagation();
					var willOpen = !li.classList.contains('wwa-sub-open');
					// Close other open desktop subs
					qsa(
						'header.elementor-location-header .elementskit-dropdown-has.wwa-sub-open, header.elementor-location-header .elementskit-dropdown-has.active'
					).forEach(function (sib) {
						if (sib !== li) closeSub(sib);
					});
					if (willOpen) openSub(li);
					else closeSub(li);
					return;
				}

				// Mobile / tablet: always accordion toggle
				e.preventDefault();
				e.stopPropagation();
				var openMobile = !li.classList.contains('wwa-sub-open') && !li.classList.contains('active');
				closeSiblingSubs(li);
				if (openMobile) openSub(li);
				else closeSub(li);
			});

			// Desktop hover: keep class while over item or panel (bridges CSS)
			if (window.matchMedia) {
				var mql = window.matchMedia('(min-width: 1025px)');
				li.addEventListener('mouseenter', function () {
					if (!mql.matches) return;
					// don't force-close others on pure hover — CSS handles multi
					li.classList.add('wwa-sub-open');
				});
				li.addEventListener('mouseleave', function () {
					if (!mql.matches) return;
					// slight delay so moving into panel padding doesn't flash-close
					window.setTimeout(function () {
						if (!li.matches(':hover')) {
							li.classList.remove('wwa-sub-open');
						}
					}, 80);
				});
			}
		});

		// Click outside closes desktop open menus
		document.addEventListener('click', function (e) {
			if (!isDesktop()) return;
			var t = e.target;
			if (t && t.closest && t.closest('header.elementor-location-header .elementskit-dropdown-has')) {
				return;
			}
			qsa(
				'header.elementor-location-header .elementskit-dropdown-has.wwa-sub-open, header.elementor-location-header .elementskit-dropdown-has.active'
			).forEach(closeSub);
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

	/* ---------- FAQ nested accordion — native <details> (reliable) ---------- */
	function clearFaqInlineLocks(root) {
		qsa('.wwa-acc-panel, .e-n-accordion-item > .e-con, .e-n-accordion-item > [role="region"]', root || document).forEach(
			function (el) {
				// Previous builds left max-height:0 inline which blocked open content
				el.style.removeProperty('max-height');
				el.style.removeProperty('opacity');
				el.style.removeProperty('padding-top');
				el.style.removeProperty('padding-bottom');
				el.style.removeProperty('overflow');
				el.style.removeProperty('height');
				el.style.removeProperty('display');
				el.style.removeProperty('visibility');
			}
		);
	}

	function syncFaqItemState(item) {
		var title = item.querySelector('summary, .e-n-accordion-item-title');
		if (item.open) {
			item.classList.add('is-open');
			if (title) title.setAttribute('aria-expanded', 'true');
		} else {
			item.classList.remove('is-open');
			if (title) title.setAttribute('aria-expanded', 'false');
		}
	}

	function initFaq() {
		clearFaqInlineLocks(document);

		qsa('.e-n-accordion, .elementor-widget-n-accordion .e-n-accordion').forEach(function (acc) {
			if (acc.getAttribute('data-wwa-faq') === '1') return;
			acc.setAttribute('data-wwa-faq', '1');

			qsa('.e-n-accordion-item', acc).forEach(function (item) {
				// Unwrap any prior animation wrapper so native details can show content
				var panel = item.querySelector(':scope > .wwa-acc-panel');
				if (panel) {
					while (panel.firstChild) {
						item.insertBefore(panel.firstChild, panel);
					}
					if (panel.parentNode) panel.parentNode.removeChild(panel);
				}

				// Ensure it's a real <details> element for native toggle
				if (item.tagName && item.tagName.toLowerCase() !== 'details') {
					// Fallback: click title to toggle class if markup is broken
					var title = item.querySelector('.e-n-accordion-item-title, summary');
					if (title && !title.getAttribute('data-wwa-faq-bound')) {
						title.setAttribute('data-wwa-faq-bound', '1');
						title.style.cursor = 'pointer';
						title.addEventListener('click', function (e) {
							e.preventDefault();
							var willOpen = !item.classList.contains('is-open');
							if (willOpen) {
								qsa('.e-n-accordion-item', acc).forEach(function (other) {
									if (other !== item) {
										other.classList.remove('is-open');
										other.removeAttribute('open');
										other.open = false;
										syncFaqItemState(other);
									}
								});
								item.classList.add('is-open');
								item.setAttribute('open', '');
							} else {
								item.classList.remove('is-open');
								item.removeAttribute('open');
							}
							syncFaqItemState(item);
						});
					}
					syncFaqItemState(item);
					return;
				}

				// Native details: do NOT preventDefault — browser toggles open
				item.addEventListener('toggle', function () {
					if (item.open) {
						// One item open at a time
						qsa('.e-n-accordion-item', acc).forEach(function (other) {
							if (other !== item && other.open) {
								other.open = false;
								syncFaqItemState(other);
							}
						});
					}
					syncFaqItemState(item);
					// Clear any residual locks after open/close
					clearFaqInlineLocks(item);
				});

				// Keyboard: Enter/Space on summary already works natively
				syncFaqItemState(item);
			});
		});
	}

	/* ---------- Leadership bio slide panel ---------- */
	/* Fallback bios when popup DOM is missing or empty (from live popup fragments). */
	var WWA_BIO_BY_ID = {
		'2663': {
			name: 'Ahmed Mohiuddin',
			role: 'Chairman / Founder',
			body:
				'Every great enterprise is built twice — first in vision, then in perseverance.\n\n' +
				'At Group Delta, we started with a clear purpose: to deliver port services of the highest standard, with integrity at every step. Over the years, that purpose has expanded across industries and geographies, but the core of who we are has never changed. We build on trust. We grow through people. And we measure success not just by what we achieve, but by the value we create for those we serve.\n\n' +
				'To our clients, partners, and teams: you are the reason we strive for more. The journey ahead is our most exciting yet.',
		},
		'2666': {
			name: 'Shamil Ahmed',
			role: 'Director',
			body:
				'The businesses that endure are not those that resist change, they are those that lead it.\n\n' +
				'At Group Delta, innovation is not a department or a strategy. It is a mindset that runs through everything we do. We invest in technology, in people, and in ideas that keep us ahead, so that our clients always have a partner who is ready for what comes next.\n\n' +
				'We are grateful for the trust that has brought us this far, and energised by the possibilities that lie ahead.',
		},
		'2669': {
			name: 'Mohammed Shahzeer',
			role: 'Director',
			body:
				'Diversification is often seen as a business strategy. For us, it is a reflection of curiosity, a genuine desire to learn, adapt and contribute across new frontiers.\n\n' +
				'Paired with a deep commitment to technology, it has allowed Group Delta to grow in ways that are both broad and meaningful. We are present across sectors and markets that matter and we are constantly asking how we can do more, serve better and reach further.\n\n' +
				'The future belongs to those willing to build it. We intend to be among them, and we are honoured to have you alongside us as we do.',
		},
	};
	var WWA_BIO_BY_NAME = {
		'ahmed mohiuddin': WWA_BIO_BY_ID['2663'],
		'shamil ahmed': WWA_BIO_BY_ID['2666'],
		'mohammed shahzeer': WWA_BIO_BY_ID['2669'],
		'mohammed shahzeer\n': WWA_BIO_BY_ID['2669'],
	};

	function decodePopupId(href) {
		if (!href) return null;
		try {
			var raw = href;
			// Fully URI-encoded hash (common in Elementor markup)
			if (raw.indexOf('%3A') !== -1 || raw.indexOf('%3D') !== -1) {
				try {
					raw = decodeURIComponent(raw);
				} catch (e1) {
					/* keep raw */
				}
			}
			raw = raw.replace(/^#/, '');
			// elementor-action:action=popup:open&settings=BASE64
			var m = raw.match(/settings=([A-Za-z0-9+/=_-]+)/i);
			if (!m) {
				m = href.match(/settings%3D([A-Za-z0-9%+/=_-]+)/i);
				if (m) {
					try {
						m[1] = decodeURIComponent(m[1]);
					} catch (e2) {
						/* keep */
					}
				}
			}
			if (!m) return null;
			var b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
			var pad = '===='.slice(0, (4 - (b64.length % 4)) % 4);
			var json = atob(b64 + pad);
			var data = JSON.parse(json);
			return data.id != null ? String(data.id) : null;
		} catch (e) {
			return null;
		}
	}

	function findPopupEl(popupId) {
		if (!popupId) return null;
		return (
			qs('[data-wwa-bio-source="true"][data-elementor-id="' + popupId + '"]') ||
			qs('.elementor-' + popupId + '[data-wwa-bio-source="true"]') ||
			qs('[data-elementor-type="popup"][data-elementor-id="' + popupId + '"]') ||
			qs('.elementor-' + popupId + '[data-elementor-type="popup"]') ||
			qs('.elementor-' + popupId + '.elementor-location-popup') ||
			qs('.elementor.elementor-' + popupId) ||
			qs('[data-elementor-id="' + popupId + '"]')
		);
	}

	function extractBioFromPopup(popupEl) {
		if (!popupEl) return null;
		var clone = popupEl.cloneNode(true);
		// Strip media only — keep text nodes
		qsa('img, picture, video, svg, .elementor-widget-image, script, link, style', clone).forEach(
			function (n) {
				n.remove();
			}
		);

		var name = '';
		var role = '';
		// Prefer real heading tags for name
		var hTag = qs('h1, h2, h3, h4, h5, h6', clone);
		if (hTag) name = (hTag.textContent || '').replace(/\s+/g, ' ').trim();

		// Titles in Elementor often use span/div/p.elementor-heading-title
		var titles = qsa('.elementor-heading-title', clone)
			.map(function (el) {
				return (el.textContent || '').replace(/\s+/g, ' ').trim();
			})
			.filter(Boolean);

		if (!name && titles[0]) name = titles[0];
		// Role: first non-name title that is NOT a long bio paragraph
		var shortTitles = qsa(
			'h1 .elementor-heading-title, h2 .elementor-heading-title, h3 .elementor-heading-title, h4 .elementor-heading-title, h5 .elementor-heading-title, h6 .elementor-heading-title, span.elementor-heading-title, div.elementor-heading-title',
			clone
		)
			.map(function (el) {
				return (el.textContent || '').replace(/\s+/g, ' ').trim();
			})
			.filter(Boolean);

		for (var i = 0; i < shortTitles.length; i++) {
			if (shortTitles[i] === name) continue;
			if (shortTitles[i].length < 80) {
				role = shortTitles[i];
				break;
			}
		}
		if (!role) {
			for (var j = 0; j < titles.length; j++) {
				if (titles[j] === name) continue;
				if (titles[j].length < 80) {
					role = titles[j];
					break;
				}
			}
		}

		// Body: all paragraph text (including p.elementor-heading-title used as body copy)
		var bodyParts = qsa('p, .elementor-text-editor, .elementor-widget-text-editor, .elementor-heading-title', clone)
			.map(function (p) {
				return (p.textContent || '').replace(/\s+/g, ' ').trim();
			})
			.filter(function (t) {
				return t && t !== name && t !== role && t.length > 40;
			});

		// Dedupe
		var seen = {};
		bodyParts = bodyParts.filter(function (t) {
			if (seen[t]) return false;
			seen[t] = true;
			return true;
		});

		// Fallback: long heading-title nodes as body
		if (!bodyParts.length) {
			bodyParts = titles.filter(function (t) {
				return t !== name && t !== role && t.length > 40;
			});
		}

		// Last resort: full text content
		if (!bodyParts.length) {
			var full = (clone.textContent || '').replace(/\s+/g, ' ').trim();
			if (name) full = full.replace(name, '').trim();
			if (role) full = full.replace(role, '').trim();
			if (full.length > 40) bodyParts = [full];
		}

		if (!name && !role && !bodyParts.length) return null;
		return {
			name: name,
			role: role,
			body: bodyParts.join('\n\n'),
		};
	}

	function extractBioFromCard(btn) {
		var card =
			btn.closest('.popup-main-sec-blks') ||
			btn.closest('.team-card-updated') ||
			btn.closest('.e-con.e-child');
		if (!card) return { name: '', role: '', body: '' };

		// Prefer the card root so we get name + role from the whole card
		var scope = card;
		var heads = qsa('h1,h2,h3,h4,h5,h6,.elementor-heading-title', scope).filter(function (el) {
			// ignore the Read Bio control itself
			return !el.closest('a.elementor-button');
		});
		var texts = heads
			.map(function (h) {
				return (h.textContent || '').replace(/\s+/g, ' ').trim();
			})
			.filter(Boolean);

		// Dedupe consecutive
		var uniq = [];
		texts.forEach(function (t) {
			if (uniq[uniq.length - 1] !== t) uniq.push(t);
		});

		return {
			name: uniq[0] || '',
			role: uniq[1] || '',
			body: uniq.slice(2).filter(function (t) { return t.length > 20; }).join('\n\n') || '',
		};
	}

	function resolveBioFallback(popupId, fromCard) {
		if (popupId && WWA_BIO_BY_ID[popupId]) {
			return WWA_BIO_BY_ID[popupId];
		}
		var key = ((fromCard && fromCard.name) || '').replace(/\s+/g, ' ').trim().toLowerCase();
		if (key && WWA_BIO_BY_NAME[key]) {
			return WWA_BIO_BY_NAME[key];
		}
		return null;
	}

	function openBioPanel(bio) {
		var existing = qs('.wwa-bio-overlay');
		if (existing) existing.remove();

		bio = bio || {};
		var overlay = document.createElement('div');
		overlay.className = 'wwa-bio-overlay';
		overlay.innerHTML =
			'<div class="wwa-bio-panel" role="dialog" aria-modal="true" aria-label="Leader biography">' +
			'<button type="button" class="wwa-bio-close" aria-label="Close">&times;</button>' +
			'<div class="wwa-bio-inner">' +
			'<h3 class="wwa-bio-name"></h3>' +
			'<p class="wwa-bio-role"></p>' +
			'<div class="wwa-bio-body"></div>' +
			'</div>' +
			'</div>';
		document.body.appendChild(overlay);
		document.body.classList.add('wwa-bio-open');
		document.body.style.overflow = 'hidden';

		var panel = qs('.wwa-bio-panel', overlay);
		var nameEl = qs('.wwa-bio-name', panel);
		var roleEl = qs('.wwa-bio-role', panel);
		var bodyEl = qs('.wwa-bio-body', panel);

		nameEl.textContent = bio.name || 'Bio';
		if (bio.role) {
			roleEl.textContent = bio.role;
			roleEl.style.display = '';
		} else {
			roleEl.style.display = 'none';
		}
		// Prefer HTML line breaks for multi-paragraph bios
		var bodyText = bio.body || '';
		if (bodyText) {
			bodyEl.innerHTML = bodyText
				.split(/\n\n+/)
				.map(function (para) {
					return '<p>' + para.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>';
				})
				.join('');
		} else {
			bodyEl.innerHTML = '<p class="wwa-bio-empty">Biography details are unavailable.</p>';
		}

		// open: right -> left (above header)
		requestAnimationFrame(function () {
			overlay.classList.add('is-open');
		});

		function close() {
			overlay.classList.remove('is-open');
			panel.classList.add('is-closing');
			document.body.classList.remove('wwa-bio-open');
			document.body.style.overflow = '';
			setTimeout(function () {
				if (overlay.parentNode) overlay.remove();
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
			false
		);
	}

	function initLeadershipBio() {
		// Delegate so dynamically injected cards still work
		document.addEventListener(
			'click',
			function (e) {
				var btn = e.target.closest
					? e.target.closest('a.elementor-button, a.elementor-button-link')
					: null;
				if (!btn) return;
				var label = (btn.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
				if (label.indexOf('read bio') === -1) return;

				e.preventDefault();
				e.stopPropagation();

				var href = btn.getAttribute('href') || '';
				// Some cards put the popup action on a parent anchor, not the button
				if (!href || href === '#' || href.indexOf('popup') === -1) {
					var parentLink = btn.closest('a[href*="popup"], a[href*="elementor-action"]');
					if (parentLink) href = parentLink.getAttribute('href') || href;
					// Also check sibling/parent card image link
					if ((!href || href === '#' || href.indexOf('popup') === -1) && btn.closest('.team-card-updated, .popup-main-sec-blks')) {
						var cardA = btn.closest('.team-card-updated, .popup-main-sec-blks');
						var actionA = cardA && qs('a[href*="popup"], a[href*="elementor-action"]', cardA);
						if (actionA) href = actionA.getAttribute('href') || href;
					}
				}

				var popupId = decodePopupId(href);
				var bio = null;

				if (popupId) {
					bio = extractBioFromPopup(findPopupEl(popupId));
				}

				var fromCard = extractBioFromCard(btn);
				if (!bio) {
					bio = fromCard;
				} else {
					if (!bio.name) bio.name = fromCard.name;
					if (!bio.role) bio.role = fromCard.role;
					if (!bio.body) bio.body = fromCard.body;
				}

				// Hard fallback when popup markup is missing or stripped
				if (!bio || !bio.body) {
					var fb = resolveBioFallback(popupId, fromCard || bio);
					if (fb) {
						bio = {
							name: (bio && bio.name) || fb.name,
							role: (bio && bio.role) || fb.role,
							body: (bio && bio.body) || fb.body,
						};
					}
				}

				openBioPanel(bio || { name: 'Bio', role: '', body: '' });
			},
			true
		);
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
