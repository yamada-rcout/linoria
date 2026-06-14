document.documentElement.classList.add("js");

const ensureLowerFixedBackground = () => {
  if (document.querySelector(".lower-fixed-bg")) return;

  const background = document.createElement("div");
  background.className = "lower-fixed-bg";
  background.setAttribute("aria-hidden", "true");

  for (let i = 0; i < 6; i += 1) {
    background.appendChild(document.createElement("span"));
  }

  document.body.prepend(background);
};

ensureLowerFixedBackground();

const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const mobileHeaderQuery = window.matchMedia("(max-width: 720px)");
const hero = document.querySelector(".hero");
const aboutSection = document.querySelector(".about-section");
const lowerBgStart = document.querySelector(".reason-section");
let lastScrollY = window.scrollY;

const setHeaderState = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

const setLowerBackgroundState = () => {
  const target = lowerBgStart || aboutSection;
  if (!target) {
    document.body.classList.add("lower-bg-visible");
    return;
  }
  const rect = target.getBoundingClientRect();
  const triggerPoint = mobileHeaderQuery.matches ? window.innerHeight * 0.72 : window.innerHeight * 0.78;
  document.body.classList.toggle("lower-bg-visible", rect.top <= triggerPoint);
};

const setHeroPinnedState = () => {
  if (!hero) return;
  const rect = hero.getBoundingClientRect();
  document.body.classList.toggle("hero-pin-hidden", rect.bottom <= 0);
};

setHeaderState();
setLowerBackgroundState();
setHeroPinnedState();

window.addEventListener(
  "scroll",
  () => {
    setHeaderState();
    setLowerBackgroundState();
    setHeroPinnedState();
    if (!header) return;
    if (!mobileHeaderQuery.matches) {
      header.classList.remove("is-hidden", "is-menu-open");
      menuToggle?.setAttribute("aria-expanded", "false");
      return;
    }

    const currentScrollY = window.scrollY;
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

  if (contactForm.action.startsWith("mailto:")) {
    return;
  }

  event.preventDefault();
  if (formStatus) {
    formStatus.textContent = "送信先の設定を確認してください。";
  }
});
