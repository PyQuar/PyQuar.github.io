// Set the launch date (change this to your desired date)
// Format: Year, Month (0-11), Day, Hour, Minute, Second
const launchDate = new Date('2025-11-01T00:00:00').getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const distance = launchDate - now;
    
    // Calculate time units
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    // Update the countdown display
    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    
    // If countdown is finished
    if (distance < 0) {
        clearInterval(countdownInterval);
        document.querySelector('.countdown').innerHTML = `
            <div style="font-size: 2rem; font-weight: bold; color: #4ecdc4;">
                🎉 We're Live! 🎉
            </div>
        `;
        document.querySelector('.coming-soon-text p').textContent = '✨ Welcome to Press Club!';
        
        // You can redirect to the main site or reveal content here
        // window.location.href = 'main.html';
    }
}

// Update countdown every second
const countdownInterval = setInterval(updateCountdown, 1000);

// Initial call
updateCountdown();

// Add particle effect on mouse move
document.addEventListener('mousemove', (e) => {
    if (Math.random() > 0.95) {
        createParticle(e.clientX, e.clientY);
    }
});

function createParticle(x, y) {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.width = '5px';
    particle.style.height = '5px';
    particle.style.borderRadius = '50%';
    particle.style.background = `rgba(${Math.random() * 255}, ${Math.random() * 255}, 255, 0.8)`;
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '999';
    particle.style.transition = 'all 1s ease-out';
    
    document.body.appendChild(particle);
    
    setTimeout(() => {
        particle.style.opacity = '0';
        particle.style.transform = `translate(${(Math.random() - 0.5) * 100}px, ${(Math.random() - 0.5) * 100}px) scale(0)`;
    }, 10);
    
    setTimeout(() => {
        particle.remove();
    }, 1000);
}

// Add typing effect to description
const description = document.querySelector('.description p');
const originalText = description.textContent;
description.textContent = '';

let charIndex = 0;
function typeWriter() {
    if (charIndex < originalText.length) {
        description.textContent += originalText.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 50);
    }
}

// Start typing effect after page loads
setTimeout(typeWriter, 2000);

// Add hover sound effect (optional - uncomment to enable)
/*
const hoverSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwF');
document.querySelectorAll('.feature').forEach(feature => {
    feature.addEventListener('mouseenter', () => {
        hoverSound.play();
    });
});
*/
