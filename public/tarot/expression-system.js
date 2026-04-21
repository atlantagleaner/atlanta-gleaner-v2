/**
 * Expression System for Psychic Reader Character
 * Manages character animations, pose transitions, and expression changes
 */

const ExpressionSystem = (() => {
  // ========== EXPRESSION DEFINITIONS ==========
  const EXPRESSIONS = {
    'neutral-welcome': {
      name: 'Neutral Welcome',
      modifier: (ctx) => {
        // Arms slightly raised, open posture
        ctx.globalAlpha = 0.95;
      },
      armsModifier: () => ({ armScale: 1.1, armRotation: -15 }),
    },
    'focused': {
      name: 'Focused Concentration',
      modifier: (ctx) => {
        // Slightly forward lean
        ctx.globalAlpha = 0.92;
      },
      eyeModifier: () => ({ eyeWidth: 3.5, eyeHeight: 3.5 }),
      handModifier: () => ({ handOpacity: 0.8 }),
    },
    'revelation': {
      name: 'Revelation',
      modifier: (ctx) => {
        // Brighter, more alert
        ctx.globalAlpha = 1.0;
        ctx.shadowColor = 'rgba(255,170,221,0.6)';
      },
      eyeModifier: () => ({ eyeGlow: true, eyeGlowIntensity: 1.5 }),
      glowModifier: () => ({ glowScale: 1.4, glowOpacity: 0.7 }),
    },
    'knowing-smile': {
      name: 'Knowing Smile',
      modifier: (ctx) => {
        ctx.globalAlpha = 0.98;
      },
      mouthModifier: () => ({ mouthSmile: true, mouthIntensity: 1.2 }),
    },
    'cosmic-vision': {
      name: 'Intense/Cosmic Vision',
      modifier: (ctx) => {
        ctx.globalAlpha = 1.0;
      },
      bothHandsModifier: () => ({ handsRadiate: true, radiateIntensity: 2.0 }),
      glowModifier: () => ({ glowScale: 1.8, glowOpacity: 1.0 }),
      auraModifier: () => ({ auraColor: '#ffaadd', auraIntensity: 1.5 }),
    },
    'playful-mischief': {
      name: 'Playful Mischief',
      modifier: (ctx) => {
        ctx.globalAlpha = 0.96;
      },
      headModifier: () => ({ headTilt: 8 }),
      eyeModifier: () => ({ eyeWink: true }),
      mouthModifier: () => ({ mouthSmile: true, mouthIntensity: 0.8 }),
    },
  };

  // ========== STATE ==========
  let currentExpression = 'neutral-welcome';
  let transitionProgress = 0;
  let isTransitioning = false;
  let targetExpression = 'neutral-welcome';

  // ========== PUBLIC API ==========
  return {
    /**
     * Set expression with smooth transition
     * @param {string} expressionName - Expression key from EXPRESSIONS
     * @param {number} duration - Transition duration in ms (default 300)
     */
    setExpression(expressionName, duration = 300) {
      if (!EXPRESSIONS[expressionName]) {
        console.warn(`Expression "${expressionName}" not found`);
        return;
      }

      targetExpression = expressionName;
      isTransitioning = true;
      transitionProgress = 0;

      // Animate transition
      const startTime = performance.now();
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        transitionProgress = Math.min(elapsed / duration, 1);

        if (transitionProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          currentExpression = targetExpression;
          isTransitioning = false;
          transitionProgress = 0;
        }
      };

      requestAnimationFrame(animate);
    },

    /**
     * Get current expression data
     * @returns {Object} Current expression definition
     */
    getCurrent() {
      return EXPRESSIONS[currentExpression];
    },

    /**
     * Get transition-blended expression data for smooth animation
     * @returns {Object} Blended expression
     */
    getBlended() {
      if (!isTransitioning) {
        return EXPRESSIONS[currentExpression];
      }

      const current = EXPRESSIONS[currentExpression];
      const target = EXPRESSIONS[targetExpression];

      // Linear blend between current and target based on progress
      return {
        name: target.name,
        transitionAlpha: this._lerp(0.95, 1.0, transitionProgress),
        modifier: (ctx) => {
          ctx.globalAlpha = this._lerp(
            current.modifier ? 0.95 : 1.0,
            target.modifier ? 1.0 : 1.0,
            transitionProgress
          );
        },
        eyeModifier: transitionProgress > 0.5 ? target.eyeModifier : current.eyeModifier,
        mouthModifier: transitionProgress > 0.5 ? target.mouthModifier : current.mouthModifier,
        glowModifier: transitionProgress > 0.5 ? target.glowModifier : current.glowModifier,
      };
    },

    /**
     * Helper for linear interpolation
     * @private
     */
    _lerp(a, b, t) {
      return a + (b - a) * t;
    },

    /**
     * Check if currently transitioning
     * @returns {boolean}
     */
    isTransitioning() {
      return isTransitioning;
    },

    /**
     * Get all available expressions
     * @returns {Array} Expression names
     */
    getAvailableExpressions() {
      return Object.keys(EXPRESSIONS);
    },

    /**
     * Reset to neutral
     */
    reset() {
      currentExpression = 'neutral-welcome';
      targetExpression = 'neutral-welcome';
      isTransitioning = false;
      transitionProgress = 0;
    },
  };
})();

// ========== SCENE SYSTEM ==========
const SceneSystem = (() => {
  const SCENES = {
    'cosmic-night': {
      name: 'Cosmic Night',
      colors: {
        primary: '#0d0921',
        accent: '#1a0f3a',
        star: '#f9ca24',
      },
      renderBackground(canvas, ctx) {
        // Starfield with nebula
        ctx.fillStyle = this.colors.primary;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Distant nebula
        const nebulaGrad = ctx.createRadialGradient(
          canvas.width * 0.3,
          canvas.height * 0.3,
          20,
          canvas.width * 0.3,
          canvas.height * 0.3,
          120
        );
        nebulaGrad.addColorStop(0, 'rgba(249,202,36,0.15)');
        nebulaGrad.addColorStop(1, 'rgba(249,202,36,0)');
        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Random stars
        ctx.fillStyle = '#f9ca24';
        for (let i = 0; i < 30; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const size = Math.random() * 1.5;
          ctx.fillRect(x, y, size, size);
        }
      },
    },
    'moonlit-ritual': {
      name: 'Moonlit Ritual Space',
      colors: {
        primary: '#0a0818',
        accent: '#1a0f2a',
        moon: '#e0d0ff',
      },
      renderBackground(canvas, ctx) {
        // Dark base
        ctx.fillStyle = this.colors.primary;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Glow from moons
        const moon1Grad = ctx.createRadialGradient(
          canvas.width * 0.2,
          canvas.height * 0.2,
          10,
          canvas.width * 0.2,
          canvas.height * 0.2,
          80
        );
        moon1Grad.addColorStop(0, 'rgba(224,208,255,0.3)');
        moon1Grad.addColorStop(1, 'rgba(224,208,255,0)');
        ctx.fillStyle = moon1Grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ritual circle outline
        ctx.strokeStyle = 'rgba(224,208,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
          canvas.width * 0.5,
          canvas.height * 0.5,
          canvas.width * 0.35,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      },
    },
    'astrophysical-lab': {
      name: 'Astrophysical Lab',
      colors: {
        primary: '#0d0921',
        accent: '#1a2a4a',
        data: '#00cec9',
      },
      renderBackground(canvas, ctx) {
        // Scientific grid background
        ctx.fillStyle = this.colors.primary;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = 'rgba(0,206,201,0.15)';
        ctx.lineWidth = 0.5;
        const gridSize = 20;
        for (let i = 0; i < canvas.width; i += gridSize) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }

        // Data stream effect
        ctx.strokeStyle = 'rgba(0,206,201,0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(0, canvas.height * (0.25 + i * 0.25));
          ctx.lineTo(canvas.width, canvas.height * (0.25 + i * 0.25));
          ctx.stroke();
        }
      },
    },
    'shadow-light': {
      name: 'Shadow & Light',
      colors: {
        primary: '#020101',
        accent: '#1a0a0a',
        light: '#ff9900',
      },
      renderBackground(canvas, ctx) {
        // Deep shadow
        ctx.fillStyle = this.colors.primary;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Torch glow from bottom-right
        const torchGrad = ctx.createRadialGradient(
          canvas.width * 0.85,
          canvas.height * 0.85,
          20,
          canvas.width * 0.85,
          canvas.height * 0.85,
          200
        );
        torchGrad.addColorStop(0, 'rgba(255,153,0,0.4)');
        torchGrad.addColorStop(1, 'rgba(255,153,0,0)');
        ctx.fillStyle = torchGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Shadow vignette
        const vignetteGrad = ctx.createRadialGradient(
          canvas.width * 0.5,
          canvas.height * 0.5,
          0,
          canvas.width * 0.5,
          canvas.height * 0.5,
          Math.max(canvas.width, canvas.height)
        );
        vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = vignetteGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      },
    },
    'abstract-energy': {
      name: 'Abstract Energy',
      colors: {
        primary: '#0a0015',
        accent: '#1a0a2a',
        energy: '#e056fd',
      },
      renderBackground(canvas, ctx) {
        // Particle field background
        ctx.fillStyle = this.colors.primary;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Wave pattern (mathematical)
        ctx.strokeStyle = 'rgba(224,86,253,0.3)';
        ctx.lineWidth = 1;
        for (let y = 0; y < canvas.height; y += 30) {
          ctx.beginPath();
          for (let x = 0; x < canvas.width; x += 10) {
            const wave = Math.sin((x + y + Date.now() * 0.001) * 0.02) * 10;
            ctx.lineTo(x, y + wave);
          }
          ctx.stroke();
        }

        // Particle clusters
        ctx.fillStyle = 'rgba(224,86,253,0.4)';
        for (let i = 0; i < 10; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const size = Math.random() * 2 + 0.5;
          ctx.fillRect(x, y, size, size);
        }
      },
    },
  };

  let currentScene = 'cosmic-night';
  let transitionProgress = 0;
  let isTransitioning = false;
  let targetScene = 'cosmic-night';

  return {
    setScene(sceneName, duration = 300) {
      if (!SCENES[sceneName]) {
        console.warn(`Scene "${sceneName}" not found`);
        return;
      }

      targetScene = sceneName;
      isTransitioning = true;
      transitionProgress = 0;

      const startTime = performance.now();
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        transitionProgress = Math.min(elapsed / duration, 1);

        if (transitionProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          currentScene = targetScene;
          isTransitioning = false;
          transitionProgress = 0;
        }
      };

      requestAnimationFrame(animate);
    },

    renderScene(canvas, ctx) {
      const scene = SCENES[currentScene];
      if (!scene) return;

      // Render base scene
      scene.renderBackground(canvas, ctx);

      // If transitioning, blend in the target scene
      if (isTransitioning && transitionProgress < 1) {
        ctx.globalAlpha = transitionProgress;
        const targetSceneObj = SCENES[targetScene];
        if (targetSceneObj) {
          targetSceneObj.renderBackground(canvas, ctx);
        }
        ctx.globalAlpha = 1;
      }
    },

    getCurrent() {
      return SCENES[currentScene];
    },

    getAvailableScenes() {
      return Object.keys(SCENES);
    },

    mapCardToScene(cardName) {
      // Map specific cards to scene vibes
      const sceneMap = {
        'the-fool': 'cosmic-night',
        'the-magician': 'astrophysical-lab',
        'the-high-priestess': 'moonlit-ritual',
        'the-empress': 'abstract-energy',
        'the-emperor': 'shadow-light',
        'the-tower': 'shadow-light',
        'the-world': 'cosmic-night',
      };
      return sceneMap[cardName.toLowerCase()] || 'cosmic-night';
    },

    mapPlanetToScene(planet) {
      const planetMap = {
        'venus': 'moonlit-ritual',
        'mars': 'astrophysical-lab',
        'mercury': 'astrophysical-lab',
        'moon': 'moonlit-ritual',
        'sun': 'cosmic-night',
        'jupiter': 'abstract-energy',
        'saturn': 'shadow-light',
      };
      return planetMap[planet] || 'cosmic-night';
    },
  };
})();
