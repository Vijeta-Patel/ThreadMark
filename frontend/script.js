document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('garmentForm');
    const submitBtn = form.querySelector('.submit-btn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Simple visual feedback for submission
        const originalText = submitBtn.querySelector('span').textContent;
        const originalIcon = submitBtn.querySelector('svg').outerHTML;
        
        // Change to loading state
        submitBtn.innerHTML = `
            <span>Processing...</span>
            <svg class="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite;">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        // Add spinning animation dynamically if not present
        if (!document.getElementById('spin-anim')) {
            const style = document.createElement('style');
            style.id = 'spin-anim';
            style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }

        // Gather form data
        const formData = {
            brand_name: document.getElementById('brand_name').value,
            material: document.getElementById('material').value,
            size: document.getElementById('size').value,
            color: document.getElementById('color').value,
            price: document.getElementById('price').value
        };

        // Send to backend
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
                submitBtn.style.backgroundColor = '#10b981'; // Success green
                submitBtn.innerHTML = `
                    <span>Saved to CSV!</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
                
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
            submitBtn.style.backgroundColor = '#ef4444'; // Error red
            submitBtn.innerHTML = `<span>Error Saving</span>`;
            
            setTimeout(() => {
                submitBtn.style.backgroundColor = '';
                submitBtn.innerHTML = `<span>${originalText}</span>${originalIcon}`;
            }, 3000);
        });
    });
});
