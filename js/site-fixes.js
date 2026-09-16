// Chợ Phú Thọ - sửa các tương tác dùng chung trên website
(function () {
    let locationInitialized = false;
    const originalInitLocationExperience = window.initLocationExperience;
    if (typeof originalInitLocationExperience === 'function') {
        window.initLocationExperience = function () {
            if (locationInitialized) return;
            locationInitialized = true;
            originalInitLocationExperience();
        };
    }

    window.addEventListener('error', function (event) {
        console.error('Site error:', event.error || event.message);
    });
})();
