document.documentElement.classList.add("js");

const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const floatingCtaGroup = document.querySelector(".floating-cta-group");
const mobileHeaderQuery = window.matchMedia("(max-width: 720px)");
const hero = document.querySelector(".hero");
let lastScrollY = window.scrollY;

const setHeaderState = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

const setHeroPinnedState = () => {
  if (!hero) return;
  const rect = hero.getBoundingClientRect();
  document.body.classList.toggle("hero-pin-hidden", rect.bottom <= 0);
};

setHeaderState();
setHeroPinnedState();

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
    const currentScrollY = window.scrollY;

    setHeaderState();
    setHeroPinnedState();
    setFloatingCtaState(currentScrollY);

    if (!header) return;
    if (!mobileHeaderQuery.matches) {
      header.classList.remove("is-hidden", "is-menu-open");
      menuToggle?.setAttribute("aria-expanded", "false");
      lastScrollY = currentScrollY;
      return;
    }

    const isMenuOpen = header.classList.contains("is-menu-open");

    if (isMenuOpen || currentScrollY < 24 || currentScrollY < lastScrollY) {
      header.classList.remove("is-hidden");
    } else if (currentScrollY > lastScrollY + 8) {
      header.classList.add("is-hidden");
    }

    lastScrollY = currentScrollY;
  },
  { passive: true }
);

menuToggle?.addEventListener("click", () => {
  if (!header) return;

  const isOpen = header.classList.toggle("is-menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "メニューを閉じる" : "メニューを開く");
  header.classList.remove("is-hidden");
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
const revealTargets = document.querySelectorAll(
  [
    ".hero-inner",
    "main > section.content-section",
    ".about-section",
    ".vmv-cta-copy",
    ".section-head",
    ".support-link-copy",
    ".support-link-panel",
    ".issue-grid article",
    ".supporter-cta-copy",
    ".supporter-cta-photo",
    ".price-summary-copy",
    ".price-summary-list",
    ".price-section > .section-link",
    ".faq-copy",
    ".faq-summary-panel",
    ".message-section > *",
    ".contact-section > *",
    "body.page-about main > section.content-section > *",
    "body.page-supporter main > section.content-section > *",
    "body.page-price main > section.content-section > *",
    ".feature-item",
    ".flow-list li"
  ].join(", ")
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
