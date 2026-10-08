document.addEventListener('DOMContentLoaded', () => {
    // ১. QR Code Setup
    const currentUrl = window.location.href.split('?')[0] + "?form=true";
    const qrEl = document.getElementById("qrcode");
    if(qrEl) {
        new QRCode(qrEl, {
            text: currentUrl,
            width: 170,
            height: 170,
            colorDark: "#0f172a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    const qrView = document.getElementById('qr-view');
    const formView = document.getElementById('form-view');
    const manualOpenBtn = document.getElementById('manual-open-form-btn');

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('form') === 'true') {
        showFormView();
    }

    if(manualOpenBtn) {
        manualOpenBtn.addEventListener('click', () => {
            showFormView();
        });
    }

    function showFormView() {
        if(qrView) qrView.style.display = 'none';
        if(formView) formView.style.display = 'block';
        
        loadDepartmentsToDropdown();
        generateDailyToken();
        initCamera();
    }

    // ২. Date-wise Auto Token Number Generation (101, 102, 103...)
    function generateDailyToken() {
        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        let tokenData = JSON.parse(localStorage.getItem('visitor_token_data')) || { date: "", lastToken: 100 };

        if (tokenData.date !== today) {
            tokenData = { date: today, lastToken: 101 };
        } else {
            tokenData.lastToken += 1;
        }

        localStorage.setItem('visitor_token_data', JSON.stringify(tokenData));
        document.getElementById('display-token').innerText = tokenData.lastToken;
        return tokenData.lastToken;
    }

    // ৩. Load Departments from Admin local storage
    function loadDepartmentsToDropdown() {
        const deptSelect = document.getElementById('department');
        const departments = JSON.parse(localStorage.getItem('departments')) || ["HR", "IT", "Accounts", "Management"];
        
        deptSelect.innerHTML = '<option value="" disabled selected>ডিপার্টমেন্ট নির্বাচন করুন</option>';
        departments.forEach(dept => {
            const opt = document.createElement('option');
            opt.value = dept;
            opt.textContent = dept;
            deptSelect.appendChild(opt);
        });
    }

    // ৪. Camera Logic
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('capture-btn');
    const photoPreview = document.getElementById('photo-preview');
    let capturedImageData = null;

    async function initCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user" }, 
                audio: false 
            });
            video.srcObject = stream;
        } catch (err) {
            console.error("Camera error:", err);
        }
    }

    if(captureBtn) {
        captureBtn.addEventListener('click', () => {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth || 400;
            canvas.height = video.videoHeight || 300;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            capturedImageData = canvas.toDataURL('image/png');
            photoPreview.src = capturedImageData;
            
            photoPreview.style.display = 'block';
            video.style.display = 'none';
            captureBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> পুনরায় ছবি তুলুন';
        });
    }

    // ৫. Form Submission to Google Sheet (Google Apps Script Web App)
    const visitorForm = document.getElementById('visitorForm');
    if(visitorForm) {
        visitorForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!capturedImageData) {
                alert("দয়া করে সাবমিট করার আগে ছবি তুলুন!");
                return;
            }

            const tokenNumber = document.getElementById('display-token').innerText;
            const formData = {
                token: tokenNumber,
                date: new Date().toLocaleString(),
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                department: document.getElementById('department').value,
                hostName: document.getElementById('hostName').value,
                purpose: document.getElementById('purpose').value,
                photo: capturedImageData
            };

            const submitBtn = document.getElementById('submit-btn');
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> সেভ হচ্ছে...';
            submitBtn.disabled = true;

            // Apnar Google Apps Script Web App URL
            const scriptURL = 'https://script.google.com/macros/s/AKfycbzlsxo1JwHLpYGw3Q7vFnDASIxSigEKyMAOVmbx_nPnOPE0WK-5vlAIKLzpmjXmqLHWoQ/exec';

            try {
                // Google Apps Script-er sathe CORS issue erar jonno mode: 'no-cors' use kora hoyeche
                await fetch(scriptURL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                // Since 'no-cors' mode doesn't return readable response json, success trigger korbe
                alert(`সফলভাবে এন্ট্রি সম্পন্ন হয়েছে! আপনার টোকেন নম্বর: ${tokenNumber}`);
                window.location.href = window.location.pathname;

            } catch (err) {
                console.error(err);
                alert("সার্ভার কানেকشن এরর!");
                submitBtn.innerHTML = '<span>তথ্য ও ছবি জমা দিন</span> <i class="fa-solid fa-arrow-right-to-bracket"></i>';
                submitBtn.disabled = false;
            }
        });
    }
});