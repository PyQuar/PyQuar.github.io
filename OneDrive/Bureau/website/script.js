// Set the launch date (change this to your desired date)
// Format: YYYY-MM-DD or use specific date
const launchDate = new Date('2025-11-15T23:59:59').getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const distance = launchDate - now;
    
    // Calculate time units
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    // Make sure we don't show negative numbers
    const displayDays = Math.max(0, days);
    const displayHours = Math.max(0, hours);
    const displayMinutes = Math.max(0, minutes);
    const displaySeconds = Math.max(0, seconds);
    
    // Update the countdown display
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (daysEl) daysEl.textContent = String(displayDays).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(displayHours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(displayMinutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(displaySeconds).padStart(2, '0');
    
    // If countdown is finished
    if (distance < 0) {
        clearInterval(countdownInterval);
        const countdownEl = document.querySelector('.countdown');
        const comingSoonEl = document.querySelector('.coming-soon-text p');
        
        if (countdownEl) {
            countdownEl.innerHTML = `
                <div style="font-size: 2rem; font-weight: bold; background: linear-gradient(135deg, #20a39e, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                    🎉 We're Live! 🎉
                </div>
            `;
        }
        
        if (comingSoonEl) {
            comingSoonEl.textContent = '✨ Welcome to Wavy Essai Press Club!';
        }
        
        // Redirect to main page after 3 seconds
        setTimeout(() => {
            window.location.href = 'main.html';
        }, 3000);
    }
}

// Initialize countdown when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCountdown);
} else {
    initCountdown();
}

function initCountdown() {
    // Initial call
    updateCountdown();
    // Update countdown every second
    window.countdownInterval = setInterval(updateCountdown, 1000);
}

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
