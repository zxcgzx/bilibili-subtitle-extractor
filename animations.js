/**
 * 现代化动画系统 - 2024年最新设计趋势
 * 包含玻璃拟态、新拟态、粒子系统等高级动画效果
 */

class ModernAnimations {
    constructor() {
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.observers = new Map();
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.isLowPowerMode = this.detectLowPowerMode();
        this.performanceLevel = this.detectPerformanceLevel();
        
        this.init();
    }
    
    // 检测低功耗模式和设备性能
    detectLowPowerMode() {
        // 检测电池状态
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                return battery.charging === false && battery.level < 0.2;
            });
        }
        // 检测设备类型
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // 检测设备性能等级
    detectPerformanceLevel() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return 'low';
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
            if (renderer.includes('intel') || renderer.includes('adreno 3')) return 'low';
            if (renderer.includes('nvidia') || renderer.includes('adreno 6')) return 'high';
        }
        
        // 基于屏幕分辨率和设备内存估算
        const screenPixels = window.screen.width * window.screen.height;
        const deviceMemory = navigator.deviceMemory || 4;
        
        if (screenPixels > 2073600 && deviceMemory >= 8) return 'high'; // 1440p+
        if (screenPixels < 921600 || deviceMemory < 4) return 'low';     // 720p-
        return 'medium';
    }

    init() {
        this.lastFrameTime = 0;
        this.setupIntersectionObserver();
        
        // 根据设备性能决定是否启用粒子系统
        if (!this.isLowPowerMode && this.performanceLevel !== 'low') {
            this.initParticleSystem();
        }
        
        this.addRippleEffect();
        
        // 只在非触摸设备上启用磁性效果
        if (window.matchMedia('(hover: hover)').matches) {
            this.addMagneticEffect();
        }
        
        this.initScrollAnimations();
        this.adjustPerformance();
    }

    // 设置滚动动画观察器
    setupIntersectionObserver() {
        if (this.isReducedMotion) return;

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, observerOptions);

        // 观察所有需要动画的元素
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });

        this.observers.set('scroll', observer);
    }

    // 元素进入动画
    animateElement(element) {
        const animationType = element.dataset.animation || 'fadeInUp';
        const delay = parseInt(element.dataset.delay) || 0;

        setTimeout(() => {
            element.classList.add('animate-in');
            
            switch (animationType) {
                case 'fadeInUp':
                    this.fadeInUp(element);
                    break;
                case 'scaleIn':
                    this.scaleIn(element);
                    break;
                case 'rotateIn':
                    this.rotateIn(element);
                    break;
                case 'slideInLeft':
                    this.slideInLeft(element);
                    break;
                case 'slideInRight':
                    this.slideInRight(element);
                    break;
            }
        }, delay);
    }

    // 动画效果实现
    fadeInUp(element) {
        element.style.transform = 'translateY(30px)';
        element.style.opacity = '0';
        element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        
        requestAnimationFrame(() => {
            element.style.transform = 'translateY(0)';
            element.style.opacity = '1';
        });
    }

    scaleIn(element) {
        element.style.transform = 'scale(0.8)';
        element.style.opacity = '0';
        element.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        requestAnimationFrame(() => {
            element.style.transform = 'scale(1)';
            element.style.opacity = '1';
        });
    }

    rotateIn(element) {
        element.style.transform = 'rotate(-10deg) scale(0.8)';
        element.style.opacity = '0';
        element.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        requestAnimationFrame(() => {
            element.style.transform = 'rotate(0deg) scale(1)';
            element.style.opacity = '1';
        });
    }

    slideInLeft(element) {
        element.style.transform = 'translateX(-50px)';
        element.style.opacity = '0';
        element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        
        requestAnimationFrame(() => {
            element.style.transform = 'translateX(0)';
            element.style.opacity = '1';
        });
    }

    slideInRight(element) {
        element.style.transform = 'translateX(50px)';
        element.style.opacity = '0';
        element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        
        requestAnimationFrame(() => {
            element.style.transform = 'translateX(0)';
            element.style.opacity = '1';
        });
    }

    // 涟漪效果
    addRippleEffect() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.ripple-btn, .action-btn, .convert-btn');
            if (!button) return;

            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0);
                animation: ripple 600ms linear;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                pointer-events: none;
            `;

            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);

            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        });
    }

    // 磁性效果
    addMagneticEffect() {
        const magneticElements = document.querySelectorAll('.magnetic');
        
        magneticElements.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                const distance = Math.sqrt(x * x + y * y);
                const maxDistance = 50;
                
                if (distance < maxDistance) {
                    const strength = (maxDistance - distance) / maxDistance;
                    const moveX = x * strength * 0.1;
                    const moveY = y * strength * 0.1;
                    
                    element.style.transform = `translate(${moveX}px, ${moveY}px)`;
                }
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translate(0, 0)';
            });
        });
    }

    // 粒子系统
    initParticleSystem() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'particle-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.2;
        `;
        
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        this.createParticles();
        this.animateParticles();

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        // 基于性能等级调整粒子数量
        let particleCount;
        if (this.performanceLevel === 'high') {
            particleCount = window.innerWidth < 768 ? 40 : 80;
        } else if (this.performanceLevel === 'medium') {
            particleCount = window.innerWidth < 768 ? 20 : 40;
        } else {
            particleCount = window.innerWidth < 768 ? 10 : 20;
        }
        
        // 低功耗模式进一步减少粒子
        if (this.isLowPowerMode) {
            particleCount = Math.floor(particleCount * 0.5);
        }
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.3 + 0.1,
                color: `hsl(${220 + Math.random() * 40}, 60%, 65%)`,
                lastUpdate: 0 // 用于帧率控制
            });
        }
    }

    animateParticles() {
        if (this.isReducedMotion) return;
        
        const currentTime = performance.now();
        
        // 基于性能等级调整帧率
        let targetFPS;
        if (this.performanceLevel === 'high') {
            targetFPS = 60;
        } else if (this.performanceLevel === 'medium') {
            targetFPS = 30;
        } else {
            targetFPS = 15;
        }
        
        const frameInterval = 1000 / targetFPS;
        
        if (currentTime - this.lastFrameTime < frameInterval) {
            this.animationId = requestAnimationFrame(() => this.animateParticles());
            return;
        }
        
        this.lastFrameTime = currentTime;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => {
            // 更新位置
            particle.x += particle.vx;
            particle.y += particle.vy;

            // 边界检查
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

            // 绘制粒子 - 优化的渲染
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            
            // 根据性能等级决定是否添加阴影效果
            if (this.performanceLevel === 'high') {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = particle.color;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // 只在高性能设备上绘制连接线
        if (this.performanceLevel === 'high') {
            this.drawConnections();
        }

        this.animationId = requestAnimationFrame(() => this.animateParticles());
    }

    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) {
                    this.ctx.save();
                    this.ctx.globalAlpha = (150 - distance) / 150 * 0.12;
                    this.ctx.strokeStyle = '#94a3b8';
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        }
    }

    // 滚动动画
    initScrollAnimations() {
        let ticking = false;

        const updateScrollAnimations = () => {
            const scrollY = window.pageYOffset;
            const windowHeight = window.innerHeight;

            // Header视差效果
            const header = document.querySelector('.header');
            if (header) {
                header.style.transform = `translateY(${scrollY * 0.5}px)`;
            }

            // 浮动元素动画
            document.querySelectorAll('.floating-element').forEach(el => {
                const speed = el.dataset.speed || 0.1;
                el.style.transform = `translateY(${scrollY * speed}px)`;
            });

            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollAnimations);
                ticking = true;
            }
        });
    }

    // 3D悬停效果
    add3DHoverEffect(element) {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / centerY * -10;
            const rotateY = (x - centerX) / centerX * 10;
            
            element.style.transform = `
                perspective(1000px) 
                rotateX(${rotateX}deg) 
                rotateY(${rotateY}deg) 
                translateZ(10px)
            `;
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    }

    // 动态调整性能
    adjustPerformance() {
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });
        
        // 监听电池状态变化
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                battery.addEventListener('levelchange', () => {
                    this.isLowPowerMode = battery.level < 0.2 && !battery.charging;
                    if (this.isLowPowerMode) {
                        this.reduceAnimations();
                    }
                });
            });
        }
    }
    
    pauseAnimations() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    resumeAnimations() {
        if (!this.animationId && !this.isReducedMotion) {
            this.animateParticles();
        }
    }
    
    reduceAnimations() {
        // 减少粒子数量
        const targetCount = Math.floor(this.particles.length * 0.5);
        this.particles = this.particles.slice(0, targetCount);
        
        // 降低帧率
        this.performanceLevel = 'low';
    }
    
    // 销毁方法
    destroy() {
        this.pauseAnimations();
        this.observers.forEach(observer => observer.disconnect());
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// CSS动画关键帧
const animationCSS = `
@keyframes ripple {
    to {
        transform: scale(2);
        opacity: 0;
    }
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
}

@keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
    50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.6); }
}

@keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}
`;

// 动态添加CSS
const style = document.createElement('style');
style.textContent = animationCSS;
document.head.appendChild(style);

// 导出类
window.ModernAnimations = ModernAnimations;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.modernAnimations = new ModernAnimations();
});