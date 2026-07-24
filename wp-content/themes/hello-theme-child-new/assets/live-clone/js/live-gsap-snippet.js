
/* ==========================================================
   GSAP + ScrollTrigger + Lenis + SplitType
   Production Ready
   ========================================================== */

if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

document.addEventListener("DOMContentLoaded", () => {

    gsap.registerPlugin(ScrollTrigger);

    /* ------------------------------------
       Lenis Smooth Scroll
    ------------------------------------ */
    const lenis = new Lenis({
        duration: 1.2,
        smoothWheel: true,
        smoothTouch: false,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    lenis.on("scroll", ScrollTrigger.update);

    /* ------------------------------------
       Wait for Fonts & Initialize
    ------------------------------------ */
    document.fonts.ready.then(() => {

        const DESKTOP = window.innerWidth >= 1100;

        // Target Headings, Text Editors (Paragraphs), Buttons, and List Items
        const elements = document.querySelectorAll(
            ".elementor-heading-title, .bsi-text .elementor-text-editor, .bsi-text .elementor-button, .bsi-text .elementor-icon-list-item"
        );

        /* ------------------------------------
           MOBILE / TABLET (No Animation Reset)
         ------------------------------------ */
        if (!DESKTOP) {
            elements.forEach(el => {
                gsap.set(el, {
                    opacity: 1,
                    visibility: "visible",
                    y: 0,
                    x: 0
                });
            });
            ScrollTrigger.refresh();
            return;
        }

        /* ------------------------------------
           DESKTOP ANIMATIONS
         ------------------------------------ */
        elements.forEach(el => {

            if (el.dataset.animated) return;
            el.dataset.animated = "true";

            gsap.set(el, {
                opacity: 1,
                visibility: "visible"
            });

            /* ------------------------------
               Text Splitting (Headings & Paragraphs)
            ------------------------------ */
            if (el.classList.contains("elementor-heading-title") || el.classList.contains("elementor-text-editor")) {

                // Split into lines & words to fix Elementor nested structure bugs
                const split = new SplitType(el, {
                    types: "lines, words",
                    lineClass: "split-line"
                });

                gsap.from(split.lines, {
                    yPercent: 110,
                    opacity: 0,
                    stagger: 0.08,
                    duration: 1.1,
                    ease: "power4.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 92%",
                        once: true
                    }
                });
            }

            /* ------------------------------
               Standard Fade-Up (Buttons & Lists)
            ------------------------------ */
            else {
                gsap.from(el, {
                    y: 30,
                    opacity: 0,
                    duration: 0.9,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 92%",
                        once: true
                    }
                });
            }
        });

        ScrollTrigger.refresh();
    });
});
