const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
const navLinks = document.querySelectorAll('.site-nav a');
const sections = document.querySelectorAll('main section[id]');
const form = document.getElementById('contactForm');
const formStatus = document.querySelector('.form-status');
const submitBtn = form?.querySelector('.submit-btn');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const setCurrentNav = () => {
  let currentId = '#top';

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 140 && rect.bottom >= 140) {
      currentId = `#${section.id}`;
    }
  });

  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === currentId;
    link.classList.toggle('active', isActive);
  });
};

window.addEventListener('scroll', setCurrentNav, { passive: true });
setCurrentNav();

const revealItems = document.querySelectorAll('.service-card, .project-card, .feature-item, .timeline-item, .about-card, .contact-form');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((item) => {
  item.classList.add('reveal');
  revealObserver.observe(item);
});

function setFormMessage(type, message) {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.remove('success', 'error');
  if (type === 'success') formStatus.classList.add('success');
  if (type === 'error') formStatus.classList.add('error');
  
  // Scroll the message into view
  formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function validatePhone(value) {
  const cleaned = value.replace(/\s+/g, '');
  return /^\+?[0-9]{7,15}$/.test(cleaned);
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      setFormMessage('error', 'Please complete all required fields correctly.');
      return;
    }

    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const service = String(formData.get('service') || '').trim();
    const message = String(formData.get('message') || '').trim();

    if (!validatePhone(phone)) {
      setFormMessage('error', 'Please enter a valid phone number.');
      return;
    }

    const config = window.EMAILJS_CONFIG || {};
    const publicKey = config.publicKey;
    const serviceId = config.serviceId;
    const templateId = config.templateId;

    if (!publicKey || !serviceId || !templateId || publicKey.includes('YOUR_') || serviceId.includes('YOUR_') || templateId.includes('YOUR_')) {
      setFormMessage('error', 'EmailJS is not configured yet. Update the values in emailjs-config.js before sending.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: name,
          from_email: email,
          phone,
          service,
          message,
          to_email: config.toEmail || 'contact.perfectenergy@gmail.com',
          reply_to: email
        },
        { publicKey }
      );

      setFormMessage('success', 'Thank you! Your message has been sent successfully. We will get back to you soon. Have a nice day!');
      form.reset();
    } catch (error) {
      console.error('EmailJS submission failed:', error);
      const detail = error?.text || error?.message || 'EmailJS rejected the request.';
      const hostWarning = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? ' Localhost is often blocked by EmailJS unless it is allowed in your EmailJS domain settings.'
        : '';
      setFormMessage('error', `EmailJS rejected the request. Check your EmailJS service/template setup and allowed domains.${hostWarning} Details: ${detail}`);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    }
  });
}
