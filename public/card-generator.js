/**
 * Celestial Tarot Card Generator
 * Procedurally generates SVG-based tarot card visuals with celestial themes
 */

const CardGenerator = (() => {
  const SUIT_THEMES = {
    wands: {
      name: 'Wands',
      colors: {
        bg: '#1a0640',
        primary: '#f9ca24',
        secondary: '#fdcb6e',
        accent: '#ff8c42',
      },
      pattern: 'shootingStars',
      symbol: '⚡',
    },
    cups: {
      name: 'Cups',
      colors: {
        bg: '#0a1e3a',
        primary: '#00cec9',
        secondary: '#74b9ff',
        accent: '#0984e3',
      },
      pattern: 'nebula',
      symbol: '~',
    },
    swords: {
      name: 'Swords',
      colors: {
        bg: '#1a1a2e',
        primary: '#c8d4e8',
        secondary: '#e0e6ff',
        accent: '#a8b9d6',
      },
      pattern: 'lightning',
      symbol: '✦',
    },
    pentacles: {
      name: 'Pentacles',
      colors: {
        bg: '#2a1810',
        primary: '#a68064',
        secondary: '#d4a574',
        accent: '#8b6f47',
      },
      pattern: 'constellation',
      symbol: '◆',
    },
  };

  const RANK_LABELS = {
    ace: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
    9: 'IX',
    10: 'X',
    page: 'PAGE',
    knight: 'KNT',
    queen: 'QUEEN',
    king: 'KING',
  };

  /**
   * Create a celestial SVG pattern for background
   */
  function createPattern(svg, theme, patternType) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    if (patternType === 'shootingStars') {
      const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern.setAttribute('id', 'shootingStars');
      pattern.setAttribute('x', '0');
      pattern.setAttribute('y', '0');
      pattern.setAttribute('width', '50');
      pattern.setAttribute('height', '50');
      pattern.setAttribute('patternUnits', 'userSpaceOnUse');

      // Random stars
      for (let i = 0; i < 3; i++) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', Math.random() * 50);
        circle.setAttribute('cy', Math.random() * 50);
        circle.setAttribute('r', '0.5');
        circle.setAttribute('fill', theme.colors.secondary);
        circle.setAttribute('opacity', '0.6');
        pattern.appendChild(circle);
      }

      // Comet trails
      for (let i = 0; i < 1; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', Math.random() * 40);
        line.setAttribute('y1', Math.random() * 40);
        line.setAttribute('x2', Math.random() * 50 + 10);
        line.setAttribute('y2', Math.random() * 50 + 10);
        line.setAttribute('stroke', theme.colors.accent);
        line.setAttribute('stroke-width', '0.3');
        line.setAttribute('opacity', '0.4');
        pattern.appendChild(line);
      }

      defs.appendChild(pattern);
    } else if (patternType === 'nebula') {
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
      gradient.setAttribute('id', 'nebula');
      gradient.setAttribute('cx', '50%');
      gradient.setAttribute('cy', '50%');
      gradient.setAttribute('r', '60%');

      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', theme.colors.secondary);
      stop1.setAttribute('stop-opacity', '0.2');
      gradient.appendChild(stop1);

      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', theme.colors.primary);
      stop2.setAttribute('stop-opacity', '0.05');
      gradient.appendChild(stop2);

      defs.appendChild(gradient);
    } else if (patternType === 'lightning') {
      const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern.setAttribute('id', 'lightning');
      pattern.setAttribute('x', '0');
      pattern.setAttribute('y', '0');
      pattern.setAttribute('width', '60');
      pattern.setAttribute('height', '60');
      pattern.setAttribute('patternUnits', 'userSpaceOnUse');

      const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      polyline.setAttribute('points', '10,10 20,30 15,35 25,50 10,60');
      polyline.setAttribute('stroke', theme.colors.primary);
      polyline.setAttribute('stroke-width', '0.5');
      polyline.setAttribute('fill', 'none');
      polyline.setAttribute('opacity', '0.3');
      pattern.appendChild(polyline);

      defs.appendChild(pattern);
    } else if (patternType === 'constellation') {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', 'constellation');

      // Star points
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * 100 + 20;
        const y = Math.random() * 100 + 20;
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '0.8');
        circle.setAttribute('fill', theme.colors.primary);
        circle.setAttribute('opacity', '0.5');
        g.appendChild(circle);
      }

      defs.appendChild(g);
    }

    svg.appendChild(defs);
  }

  /**
   * Create minor arcana card SVG
   */
  function createMinorCard(suit, rank, isReversed = false) {
    const theme = SUIT_THEMES[suit];
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '110');
    svg.setAttribute('height', '160');
    svg.setAttribute('viewBox', '0 0 110 160');
    svg.setAttribute('style', 'display:block;');

    // Background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '110');
    bg.setAttribute('height', '160');
    bg.setAttribute('fill', theme.colors.bg);
    svg.appendChild(bg);

    // Create pattern
    createPattern(svg, theme, theme.pattern);

    // Pattern overlay
    const patternRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    patternRect.setAttribute('width', '110');
    patternRect.setAttribute('height', '160');
    if (theme.pattern === 'nebula') {
      patternRect.setAttribute('fill', 'url(#nebula)');
    } else if (theme.pattern === 'shootingStars') {
      patternRect.setAttribute('fill', 'url(#shootingStars)');
    } else if (theme.pattern === 'lightning') {
      patternRect.setAttribute('fill', 'url(#lightning)');
    }
    svg.appendChild(patternRect);

    // Border
    const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    border.setAttribute('width', '110');
    border.setAttribute('height', '160');
    border.setAttribute('fill', 'none');
    border.setAttribute('stroke', theme.colors.primary);
    border.setAttribute('stroke-width', '2');
    svg.appendChild(border);

    // Inner frame
    const innerFrame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    innerFrame.setAttribute('x', '5');
    innerFrame.setAttribute('y', '5');
    innerFrame.setAttribute('width', '100');
    innerFrame.setAttribute('height', '150');
    innerFrame.setAttribute('fill', 'none');
    innerFrame.setAttribute('stroke', theme.colors.secondary);
    innerFrame.setAttribute('stroke-width', '0.8');
    innerFrame.setAttribute('opacity', '0.4');
    svg.appendChild(innerFrame);

    // Central symbol (large)
    const symbolGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    symbolGroup.setAttribute('transform', isReversed ? 'translate(55,80) rotate(180) translate(-55,-80)' : '');

    const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    symbol.setAttribute('x', '55');
    symbol.setAttribute('y', '90');
    symbol.setAttribute('text-anchor', 'middle');
    symbol.setAttribute('font-size', '32');
    symbol.setAttribute('fill', theme.colors.primary);
    symbol.setAttribute('opacity', '0.8');
    symbol.textContent = theme.symbol;
    symbolGroup.appendChild(symbol);

    svg.appendChild(symbolGroup);

    // Rank label (top-left)
    const rankText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    rankText.setAttribute('x', '8');
    rankText.setAttribute('y', '16');
    rankText.setAttribute('font-size', '7');
    rankText.setAttribute('fill', theme.colors.secondary);
    rankText.setAttribute('font-weight', 'bold');
    rankText.textContent = RANK_LABELS[rank] || rank;
    svg.appendChild(rankText);

    // Suit name (bottom)
    const suitText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    suitText.setAttribute('x', '55');
    suitText.setAttribute('y', '153');
    suitText.setAttribute('text-anchor', 'middle');
    suitText.setAttribute('font-size', '6');
    suitText.setAttribute('fill', theme.colors.secondary);
    suitText.setAttribute('opacity', '0.7');
    suitText.textContent = theme.name.toUpperCase();
    svg.appendChild(suitText);

    return svg;
  }

  /**
   * Create and return card as HTML element
   */
  function generateMinorCard(suit, rank, lightOrShadow = 'light') {
    const isReversed = lightOrShadow === 'shadow';
    const svg = createMinorCard(suit, rank, isReversed);

    const container = document.createElement('div');
    container.className = 'generated-card';
    container.style.width = '110px';
    container.style.height = '160px';
    container.appendChild(svg);

    return container;
  }

  return {
    generateMinorCard,
    createMinorCard,
    SUIT_THEMES,
  };
})();
