// Tailwind CSS 佈景主題設定 (適用於 CDN 版本)
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#00f2fe',
                secondary: '#4facfe',
                dark: '#090e17',
                darker: '#05080c'
            }
        }
    }
};

// Fancybox 初始化與設定
document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingContent = document.getElementById('loading-content');
    let loadingTimeout;

    // 顯示載入遮罩
    const showLoadingOverlay = () => {
        if (!loadingOverlay) return;
        // 顯示時移除漸變效果（立刻出現，不等待過渡動畫，避免被 Fancybox 阻塞而卡住）
        loadingOverlay.classList.remove('transition-opacity', 'duration-300', 'opacity-0', 'pointer-events-none');
        loadingOverlay.classList.add('opacity-100');
        if (loadingContent) {
            loadingContent.classList.remove('transition-transform', 'duration-300', 'scale-90');
            loadingContent.classList.add('scale-100');
        }
        // 防呆機制：確保如果 Fancybox 卡住，5秒後會自動隱藏遮罩
        clearTimeout(loadingTimeout);
        loadingTimeout = setTimeout(hideLoadingOverlay, 5000);
    };

    // 隱藏載入遮罩
    const hideLoadingOverlay = () => {
        if (!loadingOverlay) return;
        clearTimeout(loadingTimeout);
        // 隱藏時加回漸變效果，平滑淡出
        loadingOverlay.classList.add('transition-opacity', 'duration-300', 'opacity-0', 'pointer-events-none');
        loadingOverlay.classList.remove('opacity-100');
        if (loadingContent) {
            loadingContent.classList.add('transition-transform', 'duration-300', 'scale-90');
            loadingContent.classList.remove('scale-100');
        }
    };

    // 使用捕獲階段 (Capture Phase) 攔截使用者的點擊
    // 理由：Fancybox 初始化會鎖死主執行緒一段時間。我們攔截原生點擊後先強制繪製載入遮罩，退讓執行緒 50 毫秒後再交給 Fancybox 處理
    let isProgrammaticClick = false;
    document.addEventListener('click', (e) => {
        // 如果是我們自己用程式碼觸發的點擊，就直接放行給 Fancybox 處理
        if (isProgrammaticClick) return;

        const trigger = e.target.closest('.mylightbox');
        if (trigger) {
            // 攔截原本的點擊傳遞與預設行為
            e.preventDefault();
            e.stopPropagation();

            // 1. 立即顯示載入動畫（因為上面移除了 CSS transition，所以會強制於下一幀直接出現滿透明度）
            showLoadingOverlay();

            // 2. 退讓主執行緒，讓瀏覽器有 50 毫秒的時間把載入畫面的改變繪製(paint)上去
            setTimeout(() => {
                isProgrammaticClick = true;
                trigger.click(); // 重新派發點擊事件
                isProgrammaticClick = false;
            }, 50);
        }
    }, true);

    // 使用 Fancybox V5 取代原本的 GLightbox
    // Fancybox 本身已經過高度效能優化，並使用硬體加速處理動畫，不需再透過攔截事件或建立虛擬遮罩，進而完全消除人為產生的延遲感。
    Fancybox.bind('.mylightbox', {
        groupAll: true, // 將所有圖片和影片組合於同一個圖庫
        caption: function (fancybox, slide) {
            // Fancybox 預設讀取 data-caption，為了向下相容，這裡讓它直接讀取標籤上的 data-title 屬性
            return slide.triggerEl?.getAttribute('data-title') || null;
        },
        Images: {
            zoom: false, // 如果不需要額外的縮放放大鏡特效，可設為 false 加速
        },
        Toolbar: {
            display: {
                left: ["infobar"],
                middle: [
                    "zoomIn",
                    "zoomOut",
                    "toggle1to1",
                    "rotateCCW",
                    "rotateCW",
                    "flipX",
                    "flipY",
                ],
                right: ["slideshow", "thumbs", "close"],
            },
        },
        Thumbs: {
            autoStart: false, // 關閉預設開啟的縮圖列以加快開啟速度
        },
        youtube: {
            autoplay: 0
        },
        Html: {
            videoAutoplay: false
        },
        on: {
            ready: () => hideLoadingOverlay(),
            done: () => hideLoadingOverlay(),
            close: () => hideLoadingOverlay()
        }
    });
});

// 手機版選單切換邏輯
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileIcon = mobileMenuBtn?.querySelector('i');
    
    if (mobileMenuBtn && mobileMenu && mobileIcon) {
        const toggleMenu = () => {
            const isHidden = mobileMenu.classList.contains('hidden');
            
            if (isHidden) {
                // 打開選單
                mobileMenu.classList.remove('hidden');
                // 給瀏覽器一點時間渲染 block 狀態，再執行透明度和位移動畫
                setTimeout(() => {
                    mobileMenu.classList.remove('opacity-0', '-translate-y-2', 'pointer-events-none');
                    mobileMenu.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
                }, 10);
                mobileIcon.classList.remove('fa-bars');
                mobileIcon.classList.add('fa-xmark');
            } else {
                // 關閉選單
                mobileMenu.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
                mobileMenu.classList.add('opacity-0', '-translate-y-2', 'pointer-events-none');
                mobileIcon.classList.remove('fa-xmark');
                mobileIcon.classList.add('fa-bars');
                // 等待動畫結束後再隱藏 (tailwind duration-300 是 300ms)
                setTimeout(() => {
                    mobileMenu.classList.add('hidden');
                }, 300);
            }
        };

        mobileMenuBtn.addEventListener('click', toggleMenu);

        // 點擊選單內的連結後自動關閉選單
        const mobileLinks = mobileMenu.querySelectorAll('.mobile-link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (!mobileMenu.classList.contains('hidden')) {
                    toggleMenu();
                }
            });
        });

        // 按下 ESC 鍵時也可收起選單
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
                toggleMenu();
            }
        });
    }
});

// 回到頁首按鈕顯示邏輯
document.addEventListener('DOMContentLoaded', () => {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        // 當頁面向下捲動超過 300px 時顯示按鈕
        if (window.scrollY > 300) {
            backToTopBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-6');
            backToTopBtn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
        } else {
            backToTopBtn.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
            backToTopBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-6');
        }
    }, { passive: true }); // 使用 passive 提升效能
});
