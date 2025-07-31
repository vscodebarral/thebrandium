document.addEventListener("DOMContentLoaded", () => {
  // Configuração das partículas
  const particleConfig = {
    particles: {
      number: { value: 100 },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: { value: 0.3 },
      size: { value: 3 },
      move: { speed: 3 },
      line_linked: {
        enable: true,
        distance: 150,
        color: "#ffffff",
        opacity: 0.1,
        width: 1
      }
    }
  };

  const header = document.getElementById('header');
  const hero = document.querySelector('.hero.parallax');
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('nav ul.nav-links');
  const cursor = document.querySelector(".custom-cursor");
  const logoContainer = document.querySelector(".logo.tooltip-container");
  const tooltip = logoContainer ? logoContainer.querySelector(".logo-tooltip") : null;

  // Scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }

    if (hero) {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const scale = 100 + Math.min((scrollY / windowHeight) * 20, 20);
      hero.style.backgroundSize = `${scale}%`;
    }
  });

  // Menu hamburguer
  hamburger?.addEventListener('click', () => {
    navLinks?.classList.toggle('active');
    hamburger?.classList.toggle('active');
  });

  // Fechar menu ao clicar em link
  document.querySelectorAll('nav ul.nav-links li a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks?.classList.remove('active');
      hamburger?.classList.remove('active');
    });
  });

  // Animação do hero
  window.addEventListener('load', () => {
    const heroSection = document.querySelector('.hero');
    heroSection?.classList.add('animate');
  });

  // Inicializar partículas
  window.addEventListener('load', () => {
    particlesJS('particles-1', particleConfig);
    particlesJS('particles-2', particleConfig);
    particlesJS('particles-3', particleConfig);
  });

  // Portfólio / modais
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  const modals = document.querySelectorAll('.modal');

  portfolioItems.forEach(item => {
    item.addEventListener('click', () => {
      const projectId = item.getAttribute('data-project');
      const modal = document.getElementById(`modal-${projectId}`);
      modal?.classList.add('show');
    });
  });

  document.querySelectorAll('.modal .close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      closeBtn.closest('.modal')?.classList.remove('show');
    });
  });

  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });

  // Cursor personalizado
  window.addEventListener("mousemove", (e) => {
    if (cursor) {
      cursor.style.top = `${e.clientY}px`;
      cursor.style.left = `${e.clientX}px`;
    }
  });

  const clickableSelectors = "a, button, .portfolio-item";
  document.querySelectorAll(clickableSelectors).forEach(el => {
    el.addEventListener("mouseenter", () => cursor?.classList.add("hover"));
    el.addEventListener("mouseleave", () => cursor?.classList.remove("hover"));
  });

  // Link ativo no menu
  let path = window.location.pathname;
  let currentPage = path.substring(path.lastIndexOf('/') + 1).split('?')[0];
  if (!currentPage) currentPage = 'index.html';

  document.querySelectorAll(".nav-links a").forEach(link => {
    const href = link.getAttribute("href");
    const linkPage = href?.split('/').pop().split('?')[0];
    if (currentPage === linkPage) {
      link.classList.add("active");
    }
  });

  // Tooltip no logo
  if (logoContainer && tooltip) {
    logoContainer.addEventListener("mouseenter", () => {
      tooltip.style.opacity = "1";
      tooltip.style.pointerEvents = "auto";
    });
    logoContainer.addEventListener("mouseleave", () => {
      tooltip.style.opacity = "0";
      tooltip.style.pointerEvents = "none";
    });
  }

  // ✅ Toggle FAQ (dentro do DOMContentLoaded!)
  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      button.parentElement.classList.toggle('active');
    });
  });
});






const modal = document.getElementById("cookie-modal");
const form = document.getElementById("cookie-form");

function openConsentModal() {
  modal.style.display = "flex";
  loadStoredPreferences();
}

function closeModal() {
  modal.style.display = "none";
}

function loadStoredPreferences() {
  const prefs = JSON.parse(localStorage.getItem("cookieConsent")) || {};
  form.estatisticos.checked = !!prefs.estatisticos;
  form.marketing.checked = !!prefs.marketing;
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const prefs = {
    essenciais: true,
    estatisticos: form.estatisticos.checked,
    marketing: form.marketing.checked,
    timestamp: new Date().toISOString() // grava timestamp ISO 8601
  };

  localStorage.setItem("cookieConsent", JSON.stringify(prefs));

  applyCookiePreferences(prefs);

  closeModal();

  showSuccessMessage();
});

function applyCookiePreferences(prefs) {
  if (prefs.estatisticos) {
    enableGoogleAnalytics();
  } else {
    disableGoogleAnalytics();
    eraseCookie('_ga'); // apaga cookie Google Analytics
  }

  if (prefs.marketing) {
    enableMarketingScripts();
  } else {
    disableMarketingScripts();
    eraseCookie('_fbp'); // apaga cookie Facebook Pixel (exemplo)
    eraseCookie('_fbc');
  }
}

function eraseCookie(name) {
  // Apaga cookie para o domínio atual e caminho raiz
  document.cookie = name + '=; Max-Age=0; path=/; domain=' + location.hostname + ';';
}

function enableGoogleAnalytics() {
  if (!window.gtagLoaded) {
    const script = document.createElement("script");
    script.src = "https://www.googletagmanager.com/gtag/js?id=UA-XXXXXXX-X";
    script.async = true;
    document.head.appendChild(script);
    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', 'UA-XXXXXXX-X');
      window.gtagLoaded = true;
    };
  }
}

function disableGoogleAnalytics() {
  // Remove cookie _ga
  document.cookie = "_ga=; Max-Age=0; path=/;";
}

function enableMarketingScripts() {
  console.log("Marketing ativo");
  // Podes adicionar aqui o pixel do Facebook, etc.
}

function disableMarketingScripts() {
  console.log("Marketing desativado");
  // Remover scripts ou cookies de marketing que tens
}

document.addEventListener("DOMContentLoaded", () => {
  const prefs = JSON.parse(localStorage.getItem("cookieConsent"));
  if (prefs) applyCookiePreferences(prefs);
});

function showSuccessMessage() {
  if (document.getElementById('consent-success-msg')) return;

  const msg = document.createElement('div');
  msg.id = 'consent-success-msg';
  msg.textContent = "Preferências atualizadas com sucesso!";
  Object.assign(msg.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ff6a00',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '5px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    zIndex: '9999',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
  });

  document.body.appendChild(msg);

  setTimeout(() => {
    msg.remove();
  }, 3000);
}


