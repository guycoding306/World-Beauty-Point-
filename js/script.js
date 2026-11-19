
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Mobile Navigation
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            const isOpen = !mobileMenu.classList.toggle('hidden');
            menuToggle.setAttribute('aria-expanded', String(isOpen));
        });

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Homepage Hero Slider
    const hero = document.getElementById('home');
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    const heroPrev = document.getElementById('heroPrev');
    const heroNext = document.getElementById('heroNext');

    if (hero && slides.length && heroPrev && heroNext) {
        let currentSlide = 0;
        let heroTimer;

        function showSlide(index) {
            currentSlide = (index + slides.length) % slides.length;

            slides.forEach((slide, i) => {
                const active = i === currentSlide;
                slide.classList.toggle('active', active);
                slide.setAttribute('aria-hidden', String(!active));
                slide.inert = !active;
            });

            dots.forEach((dot, i) => {
                const active = i === currentSlide;
                dot.classList.toggle('active', active);

                if (active) dot.setAttribute('aria-current', 'true');
                else dot.removeAttribute('aria-current');
            });
        }

        function startHero() {
            clearInterval(heroTimer);

            if (!document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                heroTimer = setInterval(() => showSlide(currentSlide + 1), 5000);
            }
        }

        heroPrev.addEventListener('click', () => {
            showSlide(currentSlide - 1);
            startHero();
        });

        heroNext.addEventListener('click', () => {
            showSlide(currentSlide + 1);
            startHero();
        });

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                showSlide(Number(dot.dataset.slide));
                startHero();
            });
        });

        hero.addEventListener('mouseenter', () => clearInterval(heroTimer));
        hero.addEventListener('mouseleave', startHero);
        hero.addEventListener('focusin', () => clearInterval(heroTimer));
        hero.addEventListener('focusout', event => {
            if (!hero.contains(event.relatedTarget)) startHero();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) clearInterval(heroTimer);
            else startHero();
        });

        showSlide(0);
        startHero();
    }

    // Homepage Product Sliders
    function initProductSlider(sliderId, prevSelector, nextSelector) {
        const slider = document.getElementById(sliderId);
        const prev = document.querySelector(prevSelector);
        const next = document.querySelector(nextSelector);

        if (!slider || !prev || !next) return;

        function scrollProducts(direction) {
            const card = slider.querySelector('.product-card');
            if (!card) return;

            const gap = parseFloat(getComputedStyle(slider).columnGap) || 0;
            const distance = card.getBoundingClientRect().width + gap;

            slider.scrollBy({
                left: direction * distance,
                behavior: 'smooth'
            });
        }

        prev.addEventListener('click', () => scrollProducts(-1));
        next.addEventListener('click', () => scrollProducts(1));
    }

    initProductSlider('bestSellerSlider', '.product-prev', '.product-next');
    initProductSlider('arrivalSlider', '.arrival-prev', '.arrival-next');

    // Shop Page Filters and Sorting
    const shopGrid = document.getElementById('shopGrid');

    if (shopGrid) {
        const products = [...shopGrid.querySelectorAll('.shop-product')];
        const filterDrawer = document.getElementById('filterDrawer');
        const filterOverlay = document.getElementById('filterOverlay');
        const openFilters = document.getElementById('openFilters');
        const closeFilters = document.getElementById('closeFilters');
        const applyFilters = document.getElementById('applyFilters');
        const desktopFilters = document.querySelector('aside.hidden.lg\\:block');
        const mobileFilters = filterDrawer;
        const sortSelect = document.getElementById('sortProducts');
        const productCount = document.getElementById('productCount');
        const noProducts = document.getElementById('noProducts');
        const activeFilters = document.getElementById('activeFilters');
        const desktopQuery = window.matchMedia('(min-width: 1024px)');
        const formatPrice = value => `Rs. ${Number(value).toLocaleString('en-IN')}`;

        function toggleFilters(open) {
            if (!filterDrawer || !filterOverlay) return;

            filterDrawer.classList.toggle('translate-x-full', !open);
            filterOverlay.classList.toggle('hidden', !open);
            filterDrawer.inert = !open;
            document.body.style.overflow = open ? 'hidden' : '';

            if (open) closeFilters?.focus();
            else openFilters?.focus();
        }

        openFilters?.addEventListener('click', () => toggleFilters(true));
        closeFilters?.addEventListener('click', () => toggleFilters(false));
        applyFilters?.addEventListener('click', () => toggleFilters(false));
        filterOverlay?.addEventListener('click', () => toggleFilters(false));

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && filterDrawer && !filterDrawer.inert) {
                toggleFilters(false);
            }
        });

        function getFilterSource() {
            return desktopQuery.matches ? desktopFilters : mobileFilters;
        }

        function getSelectedFilters() {
            const selected = { category: [], brand: [], skin: [] };
            const source = getFilterSource();

            source?.querySelectorAll('[data-filter]:checked').forEach(input => {
                selected[input.dataset.filter].push(input.value);
            });

            return selected;
        }

        function updateFilterChips(selected, maxPrice) {
            if (!activeFilters) return;

            const labels = [
                ...selected.category,
                ...selected.brand,
                ...selected.skin
            ];

            if (maxPrice < 6000) {
                labels.push(`Up to ${formatPrice(maxPrice)}`);
            }

            activeFilters.replaceChildren();

            labels.forEach(label => {
                const chip = document.createElement('span');
                chip.className = 'filter-chip';
                chip.textContent = label.replaceAll('-', ' ');
                activeFilters.appendChild(chip);
            });

            activeFilters.classList.toggle('hidden', labels.length === 0);
            activeFilters.classList.toggle('flex', labels.length > 0);
        }

        function applyShopFilters() {
            const selected = getSelectedFilters();
            const source = getFilterSource();
            const maxPrice = Number(source?.querySelector('.price-range')?.value || 6000);
            let visibleCount = 0;

            products.forEach(product => {
                const categoryMatch = !selected.category.length ||
                    selected.category.includes(product.dataset.category);

                const brandMatch = !selected.brand.length ||
                    selected.brand.includes(product.dataset.brand);

                const skinMatch = !selected.skin.length ||
                    selected.skin.some(type => product.dataset.skin.split(' ').includes(type));

                const priceMatch = Number(product.dataset.price) <= maxPrice;
                const visible = categoryMatch && brandMatch && skinMatch && priceMatch;

                product.hidden = !visible;
                if (visible) visibleCount++;
            });

            if (productCount) productCount.textContent = visibleCount;
            noProducts?.classList.toggle('hidden', visibleCount !== 0);
            updateFilterChips(selected, maxPrice);
        }

        function sortProducts() {
            const sorted = [...products];
            const sort = sortSelect?.value || 'featured';

            sorted.sort((a, b) => {
                if (sort === 'low') return Number(a.dataset.price) - Number(b.dataset.price);
                if (sort === 'high') return Number(b.dataset.price) - Number(a.dataset.price);
                if (sort === 'name') return a.dataset.name.localeCompare(b.dataset.name);
                return products.indexOf(a) - products.indexOf(b);
            });

            sorted.forEach(product => shopGrid.appendChild(product));
        }

        document.querySelectorAll('[data-filter]').forEach(input => {
            input.addEventListener('change', () => {
                document.querySelectorAll(`[data-filter="${input.dataset.filter}"][value="${input.value}"]`)
                    .forEach(other => { other.checked = input.checked; });

                applyShopFilters();
            });
        });

        document.querySelectorAll('.price-range').forEach(input => {
            input.addEventListener('input', () => {
                document.querySelectorAll('.price-range').forEach(range => {
                    range.value = input.value;
                });

                document.querySelectorAll('.price-value').forEach(label => {
                    label.textContent = formatPrice(input.value);
                });

                applyShopFilters();
            });
        });

        document.querySelectorAll('.clear-filters').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('[data-filter]').forEach(input => {
                    input.checked = false;
                });

                document.querySelectorAll('.price-range').forEach(input => {
                    input.value = 6000;
                });

                document.querySelectorAll('.price-value').forEach(label => {
                    label.textContent = formatPrice(6000);
                });

                applyShopFilters();
            });
        });

        sortSelect?.addEventListener('change', sortProducts);
        desktopQuery.addEventListener('change', applyShopFilters);
        applyShopFilters();
    }

    // Single Product Image Gallery
    const mainImage = document.getElementById('mainProductImage');

    if (mainImage) {
        const thumbnails = [...document.querySelectorAll('.product-thumb')];
        const galleryCounter = document.getElementById('galleryCounter');
        const galleryPrev = document.getElementById('galleryPrev');
        const galleryNext = document.getElementById('galleryNext');
        let currentImage = 0;

        function showProductImage(index) {
            if (!thumbnails.length) return;

            currentImage = (index + thumbnails.length) % thumbnails.length;
            mainImage.src = thumbnails[currentImage].dataset.image;

            thumbnails.forEach((thumb, i) => {
                const active = i === currentImage;
                thumb.classList.toggle('active', active);
                thumb.setAttribute('aria-pressed', String(active));
            });

            if (galleryCounter) {
                galleryCounter.textContent =
                    `${String(currentImage + 1).padStart(2, '0')} / ${String(thumbnails.length).padStart(2, '0')}`;
            }
        }

        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => showProductImage(index));
        });

        galleryPrev?.addEventListener('click', () => showProductImage(currentImage - 1));
        galleryNext?.addEventListener('click', () => showProductImage(currentImage + 1));

        if (thumbnails.length) showProductImage(0);
    }

    // Single Product Quantity Selector
    const quantityInput = document.getElementById('productQuantity');

    if (quantityInput) {
        function updateQuantity(change) {
            const current = Number(quantityInput.value) || 1;
            const min = Number(quantityInput.min) || 1;
            const max = Number(quantityInput.max) || 20;

            quantityInput.value = Math.max(min, Math.min(max, current + change));
        }

        document.getElementById('quantityMinus')?.addEventListener('click', () => updateQuantity(-1));
        document.getElementById('quantityPlus')?.addEventListener('click', () => updateQuantity(1));
        quantityInput.addEventListener('change', () => updateQuantity(0));
    }

    // Single Product Information Tabs
    const detailTabs = document.querySelectorAll('.detail-tab');
    const detailPanels = document.querySelectorAll('.detail-panel');

    detailTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            detailTabs.forEach(item => {
                const active = item === tab;
                item.classList.toggle('active', active);
                item.setAttribute('aria-selected', String(active));
            });

            detailPanels.forEach(panel => {
                panel.classList.toggle('hidden', panel.id !== `panel-${tab.dataset.tab}`);
            });
        });
    });
});
