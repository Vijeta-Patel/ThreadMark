document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('garmentForm');
    const submitBtn = form.querySelector('.submit-btn');
    
    // QR Code elements
    const qrResult = document.getElementById('qrResult');
    const qrCanvas = document.getElementById('qrcodeCanvas');
    const qrDetailsText = document.getElementById('qrDetailsText');
    const downloadQrBtn = document.getElementById('downloadQrBtn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const originalText = submitBtn.querySelector('span').textContent;
        const originalIcon = submitBtn.querySelector('svg').outerHTML;
        
        submitBtn.innerHTML = `
            <span>Processing...</span>
            <svg class="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite;">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        if (!document.getElementById('spin-anim')) {
            const style = document.createElement('style');
            style.id = 'spin-anim';
            style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }

        const formData = {
            brand_name: document.getElementById('brand_name').value,
            material: document.getElementById('material').value,
            size: document.getElementById('size').value,
            color: document.getElementById('color').value,
            origin: document.getElementById('origin').value,
            price: document.getElementById('price').value
        };

        fetch('/api/garments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                submitBtn.style.backgroundColor = '#10b981';
                submitBtn.innerHTML = `
                    <span>Saved & Generated!</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
                
                // --- Generate QR Code ---
                // Format the data as text that will be shown when the QR is scanned
                const qrText = `ThreadMark Digital Passport
-------------------------
Brand: ${formData.brand_name}
Material: ${formData.material}
Size: ${formData.size}
Color: ${formData.color}
Origin: ${formData.origin}
Price: $${formData.price}
Status: Verified Authentic`;

                // Render QR code to canvas
                QRCode.toCanvas(qrCanvas, qrText, {
                    width: 200,
                    margin: 2,
                    color: {
                        dark: '#0f172a',  // Dark blue
                        light: '#ffffff' // White background
                    }
                }, function (error) {
                    if (error) console.error(error);
                });

                // Populate details list next to QR
                qrDetailsText.innerHTML = `
                    <p><strong>Brand:</strong> ${formData.brand_name}</p>
                    <p><strong>Material:</strong> ${formData.material}</p>
                    <p><strong>Size:</strong> ${formData.size}</p>
                    <p><strong>Color:</strong> ${formData.color}</p>
                    <p><strong>Origin:</strong> ${formData.origin}</p>
                    <p><strong>Price:</strong> $${formData.price}</p>
                `;

                // Show the QR result panel
                qrResult.style.display = 'flex';
                
                // Clear the form for the next entry
                form.reset();
                
                setTimeout(() => {
                    submitBtn.style.backgroundColor = '';
                    submitBtn.innerHTML = `
                        <span>${originalText}</span>
                        ${originalIcon}
                    `;
                }, 3000);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            submitBtn.style.backgroundColor = '#ef4444';
            submitBtn.innerHTML = `<span>Error Saving</span>`;
            
            setTimeout(() => {
                submitBtn.style.backgroundColor = '';
                submitBtn.innerHTML = `<span>${originalText}</span>${originalIcon}`;
            }, 3000);
        });
    });

    // Handle Download QR button
    downloadQrBtn.addEventListener('click', () => {
        const dataUrl = qrCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'threadmark-qr.png';
        link.href = dataUrl;
        link.click();
    });
});
