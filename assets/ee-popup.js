/* ==========================================================================
 * ee-popup.js — the quick-view popup and the Ajax cart, for
 * sections/product-grid.liquid.
 *
 * Vanilla ES module custom element. No library, no CDN, no build step (C2),
 * and nothing from Dawn (C1): this file replaces `quick-add.js`,
 * `modal-dialog`/`<modal-opener>` and `product-form.liquid` rather than
 * calling them.
 *
 * Data flow — no network round-trip to read a product:
 *   sections/product-grid.liquid renders one
 *   `<script type="application/json" data-ee-product>` per tile, built with
 *   Liquid from the real product (title, description, money-filtered prices,
 *   `options_with_values`, every variant). Opening a popup therefore reads
 *   from the DOM and paints in the same frame, with no request and no spinner.
 *   `/products/<handle>.js` would cost one request per tile for data the page
 *   already had at render time — and it could not carry money-filtered prices,
 *   which S4.4 requires.
 *
 * The business rule (CLAUDE.md §2) is data too: the section emits
 * `[data-ee-cart-rule]` with the option NAMES and values to match on, and the
 * auto-add product resolved BY HANDLE from a product picker (C7). Nothing
 * about "Color", "Black", "Size", "M" or "dark-winter-jacket" is written into
 * this file.
 * ========================================================================== */

/* Order matters: this is the tab order inside the dialog, and the first and
   last entries are the two ends of the focus trap. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/* Distance between the hotspot and the popup, and between the popup and the
   viewport edge when it has to be clamped. */
const ANCHOR_GAP = 12;

/* The host theme's cart-count element and the section that renders it. This is
 * the one place the popup touches anything outside our own markup, and it does
 * it through Shopify's Section Rendering API — a platform feature, not a Dawn
 * component: we ask the server to re-render the theme's own cart icon and swap
 * the result in, so the header count is right without a page reload (S5.3).
 * Both are feature-detected; on a theme without them the popup simply skips
 * this step and still dispatches `ee:cart:updated`.
 */
const HOST_CART_COUNT_ID = 'cart-icon-bubble';

/* Only one popup may be open at a time, across every section on the page
   (S4.9). Module scope is the shared state that guarantees it. */
let openInstance = null;

/** Case- and whitespace-insensitive comparison key for option names/values. */
const normalise = (value) => String(value === null || value === undefined ? '' : value).trim().toLowerCase();

/** Parse a `<script type="application/json">` payload, or null if unusable. */
const readJson = (element) => {
  if (!element) return null;
  try {
    return JSON.parse(element.textContent);
  } catch (error) {
    return null;
  }
};

/* Scroll lock (S4.10). `overflow: hidden` on <html> keeps the scroll position,
   so nothing jumps; the custom property replaces the width the scrollbar was
   occupying so the page does not shift sideways either. */
const lockScroll = () => {
  const root = document.documentElement;
  root.style.setProperty('--ee-scrollbar-width', `${window.innerWidth - root.clientWidth}px`);
  root.classList.add('ee-scroll-locked');
};

const unlockScroll = () => {
  const root = document.documentElement;
  root.classList.remove('ee-scroll-locked');
  root.style.removeProperty('--ee-scrollbar-width');
};

class EePopupElement extends HTMLElement {
  constructor() {
    super();

    /* Bound once so add/removeEventListener always see the same reference. */
    this.onSectionClick = this.onSectionClick.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
    this.onViewportChange = this.onViewportChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.product = null;
    this.trigger = null;
    this.pending = false;
    this.selection = new Map();
  }

  connectedCallback() {
    if (this.initialised) return;

    /* The popup lives inside its section and owns that section's hotspots. If
       the markup is not what this script expects, it does nothing at all
       rather than half-working (S8.7). */
    this.section = this.closest('[data-ee-grid]');
    this.dialog = this.querySelector('[data-ee-popup-dialog]');
    this.submitEl = this.querySelector('.ee-popup__submit');
    if (!this.section || !this.dialog || !this.submitEl) return;

    this.initialised = true;

    this.mediaEl = this.querySelector('[data-ee-popup-media]');
    /* The <img> ships inside a <template>, so that a shell with no product yet
       carries no src-less image for a harness — or a browser — to treat as
       broken. It is cloned on the first product that has one and reused after
       that. */
    this.imageTemplate = this.querySelector('[data-ee-popup-image-template]');
    this.imageEl = null;
    this.titleEl = this.querySelector('[data-ee-popup-title]');
    this.priceEl = this.querySelector('[data-ee-popup-price]');
    this.descriptionEl = this.querySelector('[data-ee-popup-description]');
    this.optionsEl = this.querySelector('[data-ee-popup-options]');
    this.statusEl = this.querySelector('[data-ee-popup-status]');

    this.templates = {
      chips: this.querySelector('[data-ee-popup-chips-template]'),
      chip: this.querySelector('[data-ee-popup-chip-template]'),
      select: this.querySelector('[data-ee-popup-select-template]'),
    };

    this.strings = readJson(this.querySelector('[data-ee-popup-strings]')) || {};
    this.rule = readJson(this.section.querySelector('[data-ee-cart-rule]'));
    this.cartAddUrl = this.dataset.eeCartAddUrl || '/cart/add.js';
    /* Which option renders as the side-by-side chips (`103:185`); everything
       else renders as the dropdown (`116:954`). Merchant-set, matched by name. */
    this.swatchOption = normalise(this.dataset.eeSwatchOption);
    this.uid = this.dialog.getAttribute('aria-labelledby') || 'ee-popup';

    /* Delegated, so the six hotspots need no per-button wiring and a hotspot
       added later in the theme editor works without re-initialising. */
    this.section.addEventListener('click', this.onSectionClick);
    /* A click that lands on the modal layer itself — never on the dialog,
       which is a child and stops the target from being `this` — is the
       click-outside close (S4.6). */
    this.addEventListener('click', (event) => {
      if (event.target === this) this.close();
    });
    this.querySelector('[data-ee-popup-close]').addEventListener('click', () => this.close());
    this.submitEl.addEventListener('click', this.onSubmit);
  }

  disconnectedCallback() {
    if (!this.initialised) return;
    this.section.removeEventListener('click', this.onSectionClick);
    if (openInstance === this) this.close();
  }

  /* ------------------------------------------------------------------ open */

  onSectionClick(event) {
    const trigger = event.target.closest('[data-ee-hotspot]');
    if (!trigger || !this.section.contains(trigger)) return;
    this.open(trigger);
  }

  open(trigger) {
    const tile = trigger.closest('[data-ee-tile]');
    const data = readJson(tile && tile.querySelector('[data-ee-product]'));
    /* A block whose product picker is empty emits no JSON, so there is nothing
       to open and the hotspot is a no-op rather than an error (S3.9). */
    if (!data) return;

    /* Closing first also covers "open a second hotspot while one is open":
       scroll lock, listeners and focus all unwind exactly once (S4.9). */
    if (openInstance) openInstance.close();

    this.product = data;
    this.trigger = trigger;
    this.render(data);

    this.hidden = false;
    lockScroll();
    this.position(trigger);

    openInstance = this;
    document.addEventListener('keydown', this.onKeydown);
    window.addEventListener('resize', this.onViewportChange);

    /* Focus lands on the dialog itself, so a screen reader announces the
       dialog and its accessible name before any control (S4.7). */
    this.dialog.focus();
  }

  close() {
    if (this.hidden) return;

    this.hidden = true;
    unlockScroll();
    document.removeEventListener('keydown', this.onKeydown);
    window.removeEventListener('resize', this.onViewportChange);
    if (openInstance === this) openInstance = null;

    this.setStatus('');
    this.product = null;

    const trigger = this.trigger;
    this.trigger = null;
    /* Focus returns to the hotspot that opened it (S4.7), unless the theme
       editor has re-rendered the section out from under us. */
    if (trigger && trigger.isConnected) trigger.focus();
  }

  /* ---------------------------------------------------------------- render */

  render(product) {
    this.selection = new Map();
    this.setStatus('');

    this.titleEl.textContent = product.title || '';
    this.priceEl.textContent = product.price || '';

    /* textContent, not innerHTML: the description arrives already stripped of
       markup by Liquid, and assigning it as text means no merchant HTML can
       ever be re-parsed inside the dialog. */
    this.descriptionEl.textContent = product.description || '';

    const image = product.image;
    this.mediaEl.hidden = !image;
    if (image && !this.imageEl && this.imageTemplate) {
      this.imageEl = this.imageTemplate.content.firstElementChild.cloneNode(true);
      this.mediaEl.append(this.imageEl);
    }
    if (image && this.imageEl) {
      this.imageEl.src = image.src;
      if (image.srcset) {
        this.imageEl.srcset = image.srcset;
        this.imageEl.sizes = '120px';
      } else {
        this.imageEl.removeAttribute('srcset');
      }
      this.imageEl.alt = image.alt || '';
    }

    this.renderOptions(product);
    this.updateState();
  }

  renderOptions(product) {
    this.optionsEl.textContent = '';

    /* `index` is the option's position in the product's own option list, and
       it is what every later lookup uses — the popup never assumes that Size
       is first or that Color is second (S5.7). The display order is the
       design's (Color at 186, Size at 262), which is why the swatch option is
       floated to the top; the underlying indices are untouched. */
    const options = (product.options || []).map((option, index) => ({ ...option, index }));
    const isSwatch = (option) => this.swatchOption !== '' && normalise(option.name) === this.swatchOption;
    options.sort((a, b) => (isSwatch(b) ? 1 : 0) - (isSwatch(a) ? 1 : 0));

    options.forEach((option) => {
      /* A product with no real options still reports one — Shopify's implicit
         "Title / Default Title". Choosing it for the shopper keeps the variant
         resolvable without showing a meaningless "Choose your title" control. */
      if (option.values.length === 1 && normalise(option.values[0]) === 'default title') {
        this.selection.set(option.name, option.values[0]);
        return;
      }
      const group = isSwatch(option) ? this.buildChipGroup(option) : this.buildSelectGroup(option);
      if (group) this.optionsEl.append(group);
    });
  }

  buildChipGroup(option) {
    const template = this.templates.chips;
    const chipTemplate = this.templates.chip;
    if (!template || !chipTemplate) return null;

    const group = template.content.firstElementChild.cloneNode(true);
    group.querySelector('.ee-popup__label').textContent = option.name;
    const list = group.querySelector('.ee-popup__chips');

    option.values.forEach((value) => {
      const chip = chipTemplate.content.firstElementChild.cloneNode(true);
      const input = chip.querySelector('.ee-popup__chip-input');
      input.name = `${this.uid}-option-${option.index}`;
      input.value = value;
      chip.querySelector('.ee-popup__chip-text').textContent = value;

      /* The colour bar takes its fill from the option value itself, which is
         how "Black" and "White" paint without a swatch image and without a
         hardcoded colour map. CSS.supports keeps an unrecognised value (a
         pattern name, say) from producing an invalid declaration — that chip
         just shows the outlined swatch. */
      const swatch = chip.querySelector('.ee-popup__swatch');
      if (window.CSS && CSS.supports('color', value)) {
        swatch.style.setProperty('--ee-chip-swatch', value);
      }

      input.addEventListener('change', () => {
        this.selection.set(option.name, value);
        list.querySelectorAll('.ee-popup__chip').forEach((entry) => {
          entry.dataset.eeSelected = String(entry === chip);
        });
        this.updateState();
      });

      list.append(chip);
    });

    return group;
  }

  buildSelectGroup(option) {
    const template = this.templates.select;
    if (!template) return null;

    const group = template.content.firstElementChild.cloneNode(true);
    const label = group.querySelector('.ee-popup__label');
    const select = group.querySelector('.ee-popup__select');
    const id = `${this.uid}-option-${option.index}`;

    select.id = id;
    label.setAttribute('for', id);
    label.textContent = option.name;

    /* "Choose your size" (`116:954`). The option name is lower-cased so the
       sentence reads naturally whatever the merchant named the option. */
    const placeholder = new Option(
      this.formatString('choose', option.name.toLowerCase()),
      '',
      true,
      true
    );
    placeholder.disabled = true;
    select.append(placeholder);
    option.values.forEach((value) => select.append(new Option(value, value)));

    select.addEventListener('change', () => {
      this.selection.set(option.name, select.value);
      this.updateState();
    });

    return group;
  }

  /* --------------------------------------------------------------- variants */

  /** The first option, in the product's own order, that has no value chosen. */
  missingOption() {
    return (this.product.options || []).find((option) => !this.selection.has(option.name)) || null;
  }

  /**
   * The variant matching the current selection.
   * Matching is name-driven: each option's own index into `variant.options`
   * comes from the product's option list, never from an assumed position.
   */
  currentVariant() {
    const product = this.product;
    if (!product || this.missingOption()) return null;
    return (
      (product.variants || []).find((variant) =>
        product.options.every(
          (option, index) => normalise(variant.options[index]) === normalise(this.selection.get(option.name))
        )
      ) || null
    );
  }

  /** Price and availability follow the selection; the button never lies. */
  updateState() {
    const variant = this.currentVariant();
    this.priceEl.textContent = (variant && variant.price) || this.product.price || '';

    if (variant && !variant.available) {
      this.setStatus(this.strings.sold_out || '');
      this.submitEl.disabled = true;
      return;
    }

    this.setStatus('');
    this.submitEl.disabled = this.pending;
  }

  /* ------------------------------------------------------------------- cart */

  onSubmit(event) {
    event.preventDefault();
    this.addToCart();
  }

  async addToCart() {
    /* First guard against a double-add: a second click while a request is in
       flight returns immediately, before anything is queued (S5.9). The
       disabled attribute set below is the second guard. */
    if (this.pending || !this.product) return;

    const missing = this.missingOption();
    if (missing) {
      this.setStatus(this.formatString('require', missing.name.toLowerCase()));
      return;
    }

    const variant = this.currentVariant();
    if (!variant) {
      this.setStatus(this.strings.unavailable || '');
      return;
    }
    if (!variant.available) {
      this.setStatus(this.strings.sold_out || '');
      return;
    }

    /* The business rule. Both lines go in ONE /cart/add.js call, which is what
       makes recursion structurally impossible: the rule is evaluated once,
       against the shopper's own selection, and the line it appends is never
       fed back through it (S5.8). */
    const items = [{ id: variant.id, quantity: 1 }];
    const bonusId = this.autoAddVariantId(variant);
    if (bonusId) items.push({ id: bonusId, quantity: 1 });

    this.setPending(true);
    this.setStatus(this.strings.adding || '');

    try {
      const body = { items };
      /* Ask for the host theme's cart icon back in the same response, so the
         header count updates without a second request or a reload (S5.3). */
      if (document.getElementById(HOST_CART_COUNT_ID)) body.sections = HOST_CART_COUNT_ID;

      const response = await fetch(this.cartAddUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);

      /* Shopify answers a rejected add with 4xx and a `description`; surfacing
         it beats a generic message, and either way the shopper sees something
         rather than a silent failure (S5.10). */
      if (!response.ok) throw new Error((payload && payload.description) || this.strings.error || '');

      this.refreshCartCount(payload);
      this.setStatus(this.strings.added || '');
      document.dispatchEvent(
        new CustomEvent('ee:cart:updated', { bubbles: true, detail: { items: (payload && payload.items) || [] } })
      );
    } catch (error) {
      this.setStatus((error && error.message) || this.strings.error || '');
    } finally {
      this.setPending(false);
    }
  }

  /**
   * The auto-add line, or null.
   *
   * Every clause is matched on the option NAME (S5.7) and compared through
   * `normalise`, so `M`, `m` and `Medium` all satisfy a clause listing
   * `M, Medium` (S5.6). The product itself was resolved by handle in Liquid,
   * never by title (C7), and its first available variant is used (S5.11).
   */
  autoAddVariantId(variant) {
    const rule = this.rule;
    if (!rule || !rule.product || !Array.isArray(rule.match) || rule.match.length === 0) return null;

    const matched = rule.match.every((clause) => {
      const index = this.product.options.findIndex((option) => normalise(option.name) === normalise(clause.option));
      if (index < 0) return false;
      const value = normalise(variant.options[index]);
      return (clause.values || []).some((candidate) => normalise(candidate) === value);
    });
    if (!matched) return null;

    const bonus = (rule.product.variants || []).find((entry) => entry.available);
    if (!bonus) return null;
    /* If the shopper is already adding that exact variant, adding it twice
       would be a duplicate, not a bonus. */
    return bonus.id === variant.id ? null : bonus.id;
  }

  refreshCartCount(payload) {
    const target = document.getElementById(HOST_CART_COUNT_ID);
    const markup = payload && payload.sections && payload.sections[HOST_CART_COUNT_ID];
    if (!target || !markup) return;
    const parsed = new DOMParser().parseFromString(markup, 'text/html');
    const source = parsed.getElementById(HOST_CART_COUNT_ID) || parsed.body;
    target.innerHTML = source.innerHTML;
  }

  /* --------------------------------------------------------------- plumbing */

  setPending(state) {
    this.pending = state;
    this.submitEl.disabled = state;
    this.submitEl.setAttribute('aria-busy', String(state));
  }

  setStatus(message) {
    this.statusEl.textContent = message;
  }

  /** Fill the `%option%` sentinel the Liquid-rendered strings carry. */
  formatString(key, value) {
    const template = this.strings[key] || '';
    return template.replace('%option%', value);
  }

  /* ------------------------------------------------------- focus + position */

  onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'Tab') this.trapFocus(event);
  }

  /** Keeps Tab and Shift+Tab inside the dialog while it is open (S4.8). */
  trapFocus(event) {
    const focusable = Array.from(this.dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      (element) => element.getClientRects().length > 0
    );

    if (focusable.length === 0) {
      event.preventDefault();
      this.dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (!this.dialog.contains(active)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && (active === first || active === this.dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onViewportChange() {
    if (this.hidden || !this.trigger) return;
    this.position(this.trigger);
  }

  /**
   * Anchors the popup to the tile that was clicked, clamped inside the
   * viewport so it can never overflow. Below 640 the stylesheet centres it
   * instead and these values are simply ignored — the breakpoint stays in CSS.
   *
   * The coordinates are written as custom properties rather than as inline
   * `left`/`top`, so no layout value is ever expressed in a style attribute.
   */
  position(trigger) {
    const anchor = trigger.getBoundingClientRect();
    const width = this.dialog.offsetWidth;
    const height = this.dialog.offsetHeight;

    let top = anchor.bottom + ANCHOR_GAP;
    if (top + height > window.innerHeight - ANCHOR_GAP) {
      const above = anchor.top - ANCHOR_GAP - height;
      top = above >= ANCHOR_GAP ? above : Math.max(ANCHOR_GAP, window.innerHeight - ANCHOR_GAP - height);
    }

    const left = Math.min(
      Math.max(ANCHOR_GAP, anchor.left + anchor.width / 2 - width / 2),
      Math.max(ANCHOR_GAP, window.innerWidth - ANCHOR_GAP - width)
    );

    this.dialog.style.setProperty('--ee-popup-left', `${Math.round(left)}px`);
    this.dialog.style.setProperty('--ee-popup-top', `${Math.round(top)}px`);
  }
}

if (!customElements.get('ee-popup')) customElements.define('ee-popup', EePopupElement);
