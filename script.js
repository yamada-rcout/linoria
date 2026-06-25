document.documentElement.classList.add("js");

const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const floatingCtaGroup = document.querySelector(".floating-cta-group");
const heroSection = document.querySelector("#page-index .hero");
const heroPin = document.querySelector("#page-index .hero-pin");
const mobileHeaderQuery = window.matchMedia("(max-width: 720px)");
let lastScrollY = window.scrollY;
let scrollFrame = 0;
let lastHeroCoveredHeight = -1;

const setHeaderState = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

const setHeroClipState = () => {
  if (!heroSection || !heroPin) return;
  const visibleBottom = Math.max(0, Math.min(window.innerHeight, heroSection.getBoundingClientRect().bottom));
  const coveredHeight = Math.round(Math.max(0, window.innerHeight - visibleBottom));
  if (coveredHeight === lastHeroCoveredHeight) return;
  lastHeroCoveredHeight = coveredHeight;
  heroPin.style.clipPath = `inset(0 0 ${coveredHeight}px 0)`;
  heroPin.style.visibility = visibleBottom > 0 ? "visible" : "hidden";
};

setHeaderState();
setHeroClipState();

const setFloatingCtaState = (currentScrollY) => {
  if (!floatingCtaGroup) return;

  if (currentScrollY < 120 || currentScrollY < lastScrollY) {
    floatingCtaGroup.classList.remove("is-hidden");
  } else if (currentScrollY > lastScrollY + 8) {
    floatingCtaGroup.classList.add("is-hidden");
  }
};

window.addEventListener(
  "scroll",
  () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;

      setHeaderState();
      setHeroClipState();
      setFloatingCtaState(currentScrollY);

      if (header && !mobileHeaderQuery.matches) {
        header.classList.remove("is-menu-open");
        menuToggle?.setAttribute("aria-expanded", "false");
      }

      lastScrollY = currentScrollY;
      scrollFrame = 0;
    });
  },
  { passive: true }
);

window.addEventListener("resize", setHeroClipState);

menuToggle?.addEventListener("click", () => {
  if (!header) return;

  const isOpen = header.classList.toggle("is-menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "メニューを閉じる" : "メニューを開く");
});

menuToggle?.addEventListener("pointerenter", () => {
  if (!header || mobileHeaderQuery.matches) return;
  header.classList.add("is-menu-open");
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "メニューを閉じる");
});

header?.addEventListener("pointerleave", () => {
  if (mobileHeaderQuery.matches) return;
  header.classList.remove("is-menu-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "メニューを開く");
});

document.addEventListener("pointerdown", (event) => {
  if (!header || !header.classList.contains("is-menu-open")) return;
  if (header.contains(event.target)) return;

  header.classList.remove("is-menu-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "メニューを開く");
});

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link || typeof window.gtag !== "function") return;

  const href = link.getAttribute("href") || "";
  const isLineCta = href.includes("line.me/R/ti/p/@434cidql");
  const isContactCta = href.includes("contact.html") || href.startsWith("mailto:");

  if (!isLineCta && !isContactCta) return;

  window.gtag("event", isLineCta ? "line_cta_click" : "contact_cta_click", {
    event_category: "engagement",
    event_label: link.textContent.trim(),
    link_url: href
  });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;

    event.preventDefault();
    header?.classList.remove("is-menu-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "メニューを開く");
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const contactForm = document.querySelector(".contact-form");
const formStatus = document.querySelector(".form-status");
const submitButton = contactForm?.querySelector('button[type="submit"]');
const requiredContactFields = contactForm
  ? Array.from(contactForm.querySelectorAll('[required]'))
  : [];
const revealTargets = Array.from(document.querySelectorAll(
  [
    ".hero-inner",
    "main > section > *",
    "main > section :is(article, li, details)",
    "#page-index :is(.top-about-cta, .supporter-bottom-cta, .price-section > .section-link, .faq-summary-panel > .section-link)"
  ].join(", ")
)).filter((target) =>
  !target.matches('[aria-hidden="true"], script, style') &&
  !target.closest("footer") &&
  !target.closest(".legal-section, .page-faq, .page-contact, #page-legal, #page-privacy, #page-terms, #page-faq, #page-contact")
);

revealTargets.forEach((target) => target.classList.add("reveal-item"));

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  revealTargets.forEach((target, index) => {
    target.style.transitionDelay = `${Math.min(index * 55, 220)}ms`;
    revealObserver.observe(target);
  });
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}

const updateScrollProgress = (element) => {
  const maxScroll = element.scrollWidth - element.clientWidth;
  const progress = maxScroll > 0 ? (element.scrollLeft / maxScroll) * 100 : 100;
  element.style.setProperty("--scroll-progress", `${Math.max(0, Math.min(100, progress))}%`);
};

const scrollProgressTargets = document.querySelectorAll(
  ".about-process-steps, .about-compare-table-wrap, .price-summary-list"
);

scrollProgressTargets.forEach((target) => {
  updateScrollProgress(target);
  target.addEventListener("scroll", () => updateScrollProgress(target), { passive: true });
});

window.addEventListener("resize", () => {
  scrollProgressTargets.forEach(updateScrollProgress);
});

const updateContactSubmitState = () => {
  if (!contactForm || !submitButton) return;

  const canSubmit = requiredContactFields.every((field) => {
    if (field.type === "checkbox") return field.checked;
    return field.value.trim() !== "" && field.checkValidity();
  });

  submitButton.disabled = !canSubmit;
};

if (contactForm) {
  updateContactSubmitState();
  contactForm.addEventListener("input", updateContactSubmitState);
  contactForm.addEventListener("change", updateContactSubmitState);
}

contactForm?.addEventListener("submit", (event) => {
  if (!contactForm.reportValidity()) {
    event.preventDefault();
    return;
  }

  if (formStatus) {
    formStatus.textContent = "送信しています。画面が切り替わるまでお待ちください。";
  }
});
