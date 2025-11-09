// ==========================================
// ANIMACIÓN DE PARTÍCULAS ABSTRACTAS
// ==========================================
class ParticlesAnimation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.animationId = null;
        this.isInitialized = false;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.createParticles();
        this.setupMouseEvents();
        this.startAnimation();
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = rect.width;
        this.height = rect.height;
    }

    createParticles() {
        this.particles = [];
        const particleCount = 80; // Número de partículas

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.3, // Velocidad lenta
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 1, // Tamaño pequeño
                opacity: Math.random() * 0.5 + 0.3,
                baseOpacity: Math.random() * 0.5 + 0.3,
                connections: [],
                hoverRadius: 100, // Radio de interacción con mouse
                maxSize: Math.random() * 3 + 2,
                pulseSpeed: Math.random() * 0.02 + 0.01
            });
        }
    }

    setupMouseEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    startAnimation() {
        const animate = () => {
            this.update();
            this.draw();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    update() {
        this.particles.forEach(particle => {
            // Movimiento lento y suave
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Rebote en los bordes
            if (particle.x < 0 || particle.x > this.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.height) particle.vy *= -1;

            // Mantener partículas dentro del canvas
            particle.x = Math.max(0, Math.min(this.width, particle.x));
            particle.y = Math.max(0, Math.min(this.height, particle.y));

            // Interacción con mouse - REPULSIÓN
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < particle.hoverRadius) {
                    // Repulsión del mouse - las partículas huyen
                    const force = (particle.hoverRadius - distance) / particle.hoverRadius;
                    // Invertir la dirección: alejarse del mouse
                    particle.vx -= (dx / distance) * force * 0.02;
                    particle.vy -= (dy / distance) * force * 0.02;

                    // Aumentar tamaño y opacidad cuando están siendo repelidas
                    particle.size = Math.min(particle.maxSize, particle.size + 0.15);
                    particle.opacity = Math.min(1, particle.opacity + 0.03);
                } else {
                    // Volver al tamaño normal gradualmente
                    particle.size = Math.max(1, particle.size - 0.05);
                    particle.opacity = Math.max(particle.baseOpacity, particle.opacity - 0.01);
                }
            } else {
                // Sin mouse, volver al estado normal
                particle.size = Math.max(1, particle.size - 0.05);
                particle.opacity = Math.max(particle.baseOpacity, particle.opacity - 0.01);
            }

            // Pulsación sutil
            particle.opacity += Math.sin(Date.now() * particle.pulseSpeed) * 0.05;
            particle.opacity = Math.max(0.1, Math.min(1, particle.opacity));
        });

        // Crear conexiones entre partículas cercanas
        this.updateConnections();
    }

    updateConnections() {
        this.particles.forEach(particle => {
            particle.connections = [];

            this.particles.forEach(otherParticle => {
                if (particle !== otherParticle) {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) { // Distancia máxima para conexión
                        // Calcular si el mouse afecta esta conexión
                        let mouseInfluence = 0;
                        if (this.mouse.x !== null && this.mouse.y !== null) {
                            // Calcular distancia del mouse a la línea de conexión
                            const lineLength = distance;
                            const mouseToParticle1 = Math.sqrt(
                                Math.pow(this.mouse.x - particle.x, 2) +
                                Math.pow(this.mouse.y - particle.y, 2)
                            );
                            const mouseToParticle2 = Math.sqrt(
                                Math.pow(this.mouse.x - otherParticle.x, 2) +
                                Math.pow(this.mouse.y - otherParticle.y, 2)
                            );

                            // Si el mouse está cerca de la línea, aumentar la influencia
                            if (mouseToParticle1 < 80 || mouseToParticle2 < 80) {
                                mouseInfluence = 0.5;
                            }
                        }

                        particle.connections.push({
                            particle: otherParticle,
                            distance: distance,
                            opacity: Math.min(1, (120 - distance) / 120 * 0.3 + mouseInfluence),
                            mouseInfluence: mouseInfluence
                        });
                    }
                }
            });
        });
    }

    draw() {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Dibujar conexiones primero (detrás de las partículas)
        this.particles.forEach(particle => {
            particle.connections.forEach(connection => {
                this.ctx.save();

                // Grosor de línea basado en influencia del mouse
                const baseLineWidth = 0.5;
                const mouseLineWidth = connection.mouseInfluence ? baseLineWidth + connection.mouseInfluence * 2 : baseLineWidth;

                this.ctx.lineWidth = mouseLineWidth;
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${connection.opacity})`;

                // Efecto de glow en conexiones influenciadas por mouse
                if (connection.mouseInfluence > 0) {
                    this.ctx.shadowBlur = 3;
                    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
                }

                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(connection.particle.x, connection.particle.y);
                this.ctx.stroke();

                this.ctx.restore();
            });
        });

        // Dibujar partículas
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = '#ffffff';

            // Dibujar partícula como círculo suave
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Efecto de glow sutil
            this.ctx.shadowBlur = particle.size * 2;
            this.ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            this.ctx.restore();
        });
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// ==========================================
// CONTROLADOR PRINCIPAL DE SCROLL
// ========================================== */
class ScrollController {
    constructor() {
        this.sections = document.querySelectorAll('.section');
        this.currentSection = 0;
        this.isAnimating = false;
        this.scrollAccumulator = 0;
        this.scrollThreshold = 50;
        this.animationProgress = 0;
        
        this.init();
    }
    
    init() {
        // Prevenir scroll nativo
        this.preventDefaultScroll();
        
        // Manejar scroll con rueda
        window.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        
        // Manejar teclado
        window.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Navegación del menú
        this.setupNavigation();
        
        // Inicializar primera sección
        this.showSection(0);
    }
    
    preventDefaultScroll() {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const delta = e.deltaY;
        const currentSectionElement = this.sections[this.currentSection];
        const sectionId = currentSectionElement.id;
        
        if (sectionId === 'blueprint') {
            this.handleBlueprintScroll(delta);
        } else if (sectionId === 'proyectos') {
            this.handleProjectsScroll(delta);
        } else if (sectionId === 'filosofia') {
            this.handlePhilosophyScroll(delta);
        } else if (sectionId === 'contacto') {
            this.handleContactScroll(delta);
        } else {
            this.handleSimpleScroll(delta);
        }
    }
    
    handleBlueprintScroll(delta) {
        if (this.isAnimating) return;
        
        this.animationProgress += delta * 0.001;
        this.animationProgress = Math.max(0, Math.min(1, this.animationProgress));
        
        this.updateBlueprint(this.animationProgress);
        
        if (this.animationProgress >= 0.99 && delta > 0) {
            if (this.currentSection < this.sections.length - 1) {
                this.scrollToNextSection();
            }
        }
        
        if (this.animationProgress <= 0.01 && delta < 0) {
            if (this.currentSection > 0) {
                this.scrollToPrevSection();
            }
        }
    }
    
    handleProjectsScroll(delta) {
        if (this.isAnimating) return;
        
        this.animationProgress += delta * 0.0008;
        this.animationProgress = Math.max(0, Math.min(1, this.animationProgress));
        
        this.updateProjects(this.animationProgress);
        
        if (this.animationProgress >= 0.99 && delta > 0) {
            if (this.currentSection < this.sections.length - 1) {
                this.scrollToNextSection();
            }
        }
        
        if (this.animationProgress <= 0.01 && delta < 0) {
            if (this.currentSection > 0) {
                this.scrollToPrevSection();
            }
        }
    }
    
    handlePhilosophyScroll(delta) {
        if (this.isAnimating) return;
        
        this.animationProgress += delta * 0.002;
        this.animationProgress = Math.max(0, Math.min(1, this.animationProgress));
        
        this.updatePhilosophy(this.animationProgress);
        
        if (this.animationProgress >= 0.99 && delta > 0) {
            if (this.currentSection < this.sections.length - 1) {
                this.scrollToNextSection();
            }
        }
        
        if (this.animationProgress <= 0.01 && delta < 0) {
            if (this.currentSection > 0) {
                this.scrollToPrevSection();
            }
        }
    }
    
    handleContactScroll(delta) {
        if (this.isAnimating) return;
        
        this.animationProgress += delta * 0.002;
        this.animationProgress = Math.max(0, Math.min(1, this.animationProgress));
        
        this.updateContact(this.animationProgress);
        
        if (this.animationProgress >= 0.99 && delta > 0) {
            return;
        }
        
        if (this.animationProgress <= 0.01 && delta < 0) {
            if (this.currentSection > 0) {
                this.scrollToPrevSection();
            }
        }
    }
    
    scrollToNextSection() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const nextIndex = this.currentSection + 1;
        this.currentSection = nextIndex;
        this.animationProgress = 0;
        
        const targetSection = this.sections[nextIndex];
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        this.updateActiveNav(nextIndex);
        this.animateSection(targetSection);
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 1000);
    }
    
    scrollToPrevSection() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const prevIndex = this.currentSection - 1;
        this.currentSection = prevIndex;
        this.animationProgress = 1;
        
        const targetSection = this.sections[prevIndex];
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        this.updateActiveNav(prevIndex);
        this.animateSection(targetSection);
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 1000);
    }
    
    handleSimpleScroll(delta) {
        if (this.isAnimating) return;
        
        this.scrollAccumulator += delta;
        
        if (Math.abs(this.scrollAccumulator) > this.scrollThreshold) {
            if (this.scrollAccumulator > 0 && this.currentSection < this.sections.length - 1) {
                this.scrollToNextSection();
            } else if (this.scrollAccumulator < 0 && this.currentSection > 0) {
                this.scrollToPrevSection();
            }
            this.scrollAccumulator = 0;
        }
    }
    
    handleKeyboard(e) {
        if (this.isAnimating) return;
        
        switch(e.key) {
            case 'ArrowDown':
            case 'PageDown':
                if (this.currentSection < this.sections.length - 1) {
                    this.scrollToNextSection();
                }
                e.preventDefault();
                break;
            case 'ArrowUp':
            case 'PageUp':
                if (this.currentSection > 0) {
                    this.scrollToPrevSection();
                }
                e.preventDefault();
                break;
        }
    }
    
    scrollToSection(index) {
        if (this.isAnimating || index === this.currentSection) return;
        
        this.isAnimating = true;
        this.currentSection = index;
        
        const targetSection = this.sections[index];
        
        targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        this.updateActiveNav(index);
        this.animateSection(targetSection);
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 1000);
    }
    
    showSection(index) {
        const section = this.sections[index];
        this.animateSection(section);
        this.updateActiveNav(index);
    }
    
    animateSection(section) {
        const sectionId = section.id;
        
        switch(sectionId) {
            case 'inicio':
                break;
            case 'blueprint':
                this.updateBlueprint(this.animationProgress);
                break;
            case 'proyectos':
                this.updateProjects(this.animationProgress);
                break;
            case 'filosofia':
                this.updatePhilosophy(this.animationProgress);
                break;
            case 'contacto':
                this.updateContact(this.animationProgress);
                break;
        }
    }
    
    // ==========================================
    // ANIMACIONES DEL BLUEPRINT
    // ==========================================
    updateBlueprint(progress) {
        const section = document.getElementById('blueprint');
        if (!section) return;
        
        const canvas = section.querySelector('.blueprint-canvas');
        if (canvas) {
            canvas.style.opacity = progress > 0.1 ? '1' : '0';
            canvas.style.transform = `scale(${0.9 + progress * 0.1})`;
        }
        
        const mainWall = section.querySelector('.main-wall');
        if (mainWall) {
            const dashOffset = 1800 - (progress * 1800);
            mainWall.style.strokeDashoffset = dashOffset;
        }
        
        const divisionLines = section.querySelectorAll('.division-line');
        divisionLines.forEach((line, index) => {
            const delay = 0.3 + index * 0.1;
            const lineProgress = Math.max(0, (progress - delay) / (1 - delay));
            const dashArray = parseFloat(line.getAttribute('stroke-dasharray'));
            const dashOffset = dashArray - (lineProgress * dashArray);
            line.style.strokeDashoffset = dashOffset;
        });
        
        const cornerMarkers = section.querySelectorAll('.corner-marker');
        cornerMarkers.forEach((marker, index) => {
            const delay = 0.2 + index * 0.05;
            marker.style.opacity = progress > delay ? '1' : '0';
        });
        
        const details = section.querySelectorAll('.blueprint-detail');
        details.forEach((detail, index) => {
            const delay = 0.5 + index * 0.1;
            detail.style.opacity = progress > delay ? '1' : '0';
        });
        
        const roomLabels = section.querySelectorAll('.room-label');
        const labelDelays = [0.7, 0.75, 0.8, 0.85, 0.9];
        roomLabels.forEach((label, index) => {
            const delay = labelDelays[index] || 0.7;
            if (progress > delay) {
                const scale = Math.min(1, (progress - delay) * 10);
                label.style.transform = `scale(${scale})`;
                label.style.opacity = '1';
            } else {
                label.style.opacity = '0';
            }
        });
        
        const dimensions = section.querySelector('.blueprint-dimensions');
        if (dimensions) {
            dimensions.style.opacity = progress > 0.95 ? '1' : '0';
        }
        
        const progressCircle = section.querySelector('.progress-circle');
        const progressText = section.querySelector('.progress-text');
        if (progressCircle && progressText) {
            const dashOffset = 126 - (progress * 126);
            progressCircle.style.strokeDashoffset = dashOffset;
            progressText.textContent = Math.round(progress * 100) + '%';
        }
        
        const stats = section.querySelectorAll('.stat-item');
        stats.forEach((stat, index) => {
            const threshold = 0.4 + index * 0.1;
            
            if (progress > threshold) {
                const itemProgress = Math.min(1, (progress - threshold) / 0.2);
                stat.style.opacity = itemProgress;
                stat.style.transform = `translateX(${(1 - itemProgress) * 150}px)`;
            } else {
                stat.style.opacity = '0';
                stat.style.transform = 'translateX(150px)';
            }
        });
        
        const status = section.querySelector('.blueprint-status');
        if (status) {
            if (progress < 0.3) {
                status.textContent = "Trazando fundamentos...";
            } else if (progress < 0.5) {
                status.textContent = "Definiendo espacios...";
            } else if (progress < 0.7) {
                status.textContent = "Integrando funciones...";
            } else if (progress < 0.95) {
                status.textContent = "Detallando acabados...";
            } else {
                status.textContent = "Plano completado";
            }
            status.style.opacity = progress > 0.7 ? '1' : '0';
        }
    }
    
    // ==========================================
    // ANIMACIONES DE PROYECTOS
    // ==========================================
    updateProjects(progress) {
        const section = document.getElementById('proyectos');
        if (!section) return;

        const projectCards = section.querySelectorAll('.project-card');
        const totalProjects = projectCards.length;

        // Usar requestAnimationFrame para animaciones más suaves
        requestAnimationFrame(() => {
            projectCards.forEach((card, index) => {
                const startProgress = index / totalProjects;
                const endProgress = (index + 1) / totalProjects;

                const isActive = progress >= startProgress && progress < endProgress;
                const projectProgress = Math.max(0, Math.min(1, (progress - startProgress) / (endProgress - startProgress)));

                // Aplicar easing para transiciones más suaves
                const easeInOut = t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
                const easedProgress = easeInOut(projectProgress);

                if (isActive) {
                    // Animación de entrada más suave
                    const scale = 0.85 + (Math.min(easedProgress, 0.4) / 0.4) * 0.15;
                    const translateX = (1 - Math.min(easedProgress, 0.4) / 0.4) * -100;
                    const opacity = Math.min(easedProgress / 0.4, 1);

                    // Usar will-change para optimizar rendimiento
                    card.style.willChange = 'transform, opacity';
                    card.style.transform = `translateX(${translateX}%) scale(${scale})`;
                    card.style.opacity = opacity;
                    card.style.zIndex = 100;
                    card.classList.add('active');
                } else if (progress < startProgress) {
                    // Estado de pila (antes del proyecto activo)
                    const stackIndex = index;
                    const stackOffset = stackIndex * 4; // Aumentar separación para evitar solapamiento
                    const stackRotate = (stackIndex % 2 === 0 ? 1 : -1) * 3; // Aumentar rotación

                    card.style.willChange = 'transform, opacity';
                    card.style.transform = `translateX(-50%) translateY(${stackOffset}px) rotate(${stackRotate}deg) scale(0.75)`;
                    card.style.opacity = '0.7';
                    card.style.zIndex = index;
                    card.classList.remove('active');
                } else {
                    // Animación de salida más suave
                    const exitProgress = Math.max(0, Math.min(1, (progress - endProgress) / (1 - endProgress)));
                    const easedExit = easeInOut(exitProgress);
                    const translateX = 100 + (easedExit * 60); // Aumentar distancia de salida
                    const opacity = Math.max(0, 1 - easedExit * 1.5);

                    card.style.willChange = 'transform, opacity';
                    card.style.transform = `translateX(${translateX}%) scale(0.85)`;
                    card.style.opacity = opacity;
                    card.style.zIndex = 1;
                    card.classList.remove('active');
                }
            });
        });
    }
    
    // ==========================================
    // ANIMACIONES DE FILOSOFÍA
    // ==========================================
    updatePhilosophy(progress) {
        const section = document.getElementById('filosofia');
        if (!section) return;
        
        const title = section.querySelector('.philosophy-title');
        if (title && progress > 0.1) {
            const titleProgress = (progress - 0.1) / 0.9;
            title.style.opacity = titleProgress;
            title.style.transform = `translateY(${(1 - titleProgress) * 50}px)`;
        }
        
        const quote = section.querySelector('.philosophy-quote');
        if (quote && progress > 0.3) {
            const quoteProgress = (progress - 0.3) / 0.7;
            quote.style.opacity = quoteProgress;
            quote.style.transform = `translateY(${(1 - quoteProgress) * 50}px)`;
        }
        
        const divider = section.querySelector('.philosophy-divider');
        if (divider && progress > 0.5) {
            divider.style.opacity = '1';
            divider.style.transform = `scaleX(${(progress - 0.5) * 2})`;
        }
        
        const text = section.querySelector('.philosophy-text');
        if (text && progress > 0.7) {
            const textProgress = (progress - 0.7) / 0.3;
            text.style.opacity = textProgress;
            text.style.transform = `translateY(${(1 - textProgress) * 40}px)`;
        }
    }
    
    // ==========================================
    // ANIMACIONES DE CONTACTO
    // ==========================================
    updateContact(progress) {
        const section = document.getElementById('contacto');
        if (!section) return;
        
        const gridPattern = section.querySelector('.contact-grid-pattern');
        if (gridPattern) {
            gridPattern.style.opacity = Math.min(progress * 2, 1);
        }
        
        const gradientOrb = section.querySelector('.contact-gradient-orb');
        if (gradientOrb) {
            gradientOrb.style.opacity = Math.min(progress * 1.5, 1);
        }
        
        const titleLetters = section.querySelectorAll('.contact-title .letter');
        titleLetters.forEach((letter, index) => {
            if (progress > 0.1) {
                const letterProgress = Math.min(1, (progress - 0.1) * 2);
                letter.style.opacity = letterProgress;
                letter.style.transform = `translate(0, 0)`;
            }
        });
        
        const subtitle = section.querySelector('.contact-subtitle');
        if (subtitle && progress > 0.3) {
            const subtitleProgress = (progress - 0.3) / 0.7;
            subtitle.style.opacity = subtitleProgress;
            subtitle.style.transform = `translateY(${(1 - subtitleProgress) * 40}px)`;
        }
        
        const formSection = section.querySelector('.contact-form-section');
        if (formSection && progress > 0.4) {
            const formProgress = (progress - 0.4) / 0.6;
            formSection.style.opacity = formProgress;
            formSection.style.transform = `translateY(${(1 - formProgress) * 50}px)`;
        }
        
        const infoSection = section.querySelector('.contact-info-section');
        if (infoSection && progress > 0.5) {
            const infoProgress = (progress - 0.5) / 0.5;
            infoSection.style.opacity = infoProgress;
            infoSection.style.transform = `translateY(${(1 - infoProgress) * 50}px)`;
        }
    }
    
    // ==========================================
    // NAVEGACIÓN
    // ==========================================
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach((link, index) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (index > this.currentSection) {
                    this.animationProgress = 0;
                } else if (index < this.currentSection) {
                    this.animationProgress = 1;
                } else {
                    return;
                }
                
                this.scrollToSection(index);
            });
        });
    }
    
    updateActiveNav(index) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach((link, i) => {
            if (i === index) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}

// ==========================================
// EFECTOS VISUALES ADICIONALES
// ==========================================
class VisualEffects {
    constructor() {
        this.init();
    }
    
    init() {
        this.initMouseEffects();
        this.initNavScroll();
    }
    
    initMouseEffects() {
        let mouseX = 0;
        let mouseY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            const glowOrbs = document.querySelectorAll('.glow-orb');
            glowOrbs.forEach((orb, index) => {
                const speed = (index + 1) * 0.015;
                const x = (mouseX - window.innerWidth / 2) * speed;
                const y = (mouseY - window.innerHeight / 2) * speed;
                orb.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }
    
    initNavScroll() {
        const nav = document.getElementById('nav');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target.id === 'inicio') {
                        nav.classList.remove('scrolled');
                    } else {
                        nav.classList.add('scrolled');
                    }
                }
            });
        }, { threshold: 0.5 });
        
        document.querySelectorAll('.section').forEach(section => {
            observer.observe(section);
        });
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar animación de partículas
    const particlesCanvas = document.getElementById('particlesCanvas');
    if (particlesCanvas) {
        const particlesAnimation = new ParticlesAnimation(particlesCanvas);
    }

    // Inicializar controlador de scroll
    const scrollController = new ScrollController();

    // Inicializar efectos visuales
    const visualEffects = new VisualEffects();

    console.log('✨ Portfolio Fernanda Maldonado cargado');
});
