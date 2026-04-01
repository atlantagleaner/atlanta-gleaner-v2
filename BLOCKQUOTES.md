# Block Quotation Handling in Legal Opinions

## Current Status

The `scripts/process-cases.js` parser includes support for detecting and converting block quotations from judicial opinions into proper `<blockquote>` HTML elements for display on the case law pages.

## The Problem

Legal opinions (especially from Westlaw and Lexis) contain block quotations formatted according to Bluebook standards:

- **Left indent:** 0.5" (common standard)
- **No quotation marks**
- **Same font and size** as surrounding text
- **Single spacing** within the block (vs. double-spaced body)
- **Extra space before/after** (usually 6pt)
- **Paragraph-level indentation** applied via Word's indentation properties

These are formatted using Word's **paragraph indentation properties**, not quotation marks.

## Why It's Not Working

The `mammoth` library (used for DOCX conversion) **does not expose indentation properties** in its HTML output. When converting a DOCX to HTML, mammoth strips away:

- Paragraph indentation (margin-left, padding-left)
- Detailed spacing properties
- Line spacing overrides

Instead, it focuses on semantic elements (lists, tables, links) and named styles.

**Result:** Indented blockquotes in the source document become regular paragraphs in the HTML output.

## Solution Approaches

### Option 1: Use Named Paragraph Styles (Current Implementation) ✓ WORKS

The parser includes an extensive `blockquoteStyleMap` that tells mammoth to recognize common blockquote style names:

```javascript
const blockquoteStyleMap = [
  "p[style-name='Block Quote'] => blockquote:fresh",
  "p[style-name='Block Quotation'] => blockquote:fresh",
  "p[style-name='Indented'] => blockquote:fresh",
  // ... and 13 more variations
];
```

**How to make this work:**

1. In the source Word documents, when creating block quotations:
   - Apply a **named paragraph style** such as "Block Quote" or "Block Quotation"
   - Do NOT rely on manual indentation alone

2. The parser will automatically detect these styles and convert them to `<blockquote>` tags

3. The `blockquoteStyleMap` in `process-cases.js` (lines 267–289) includes 16 common style name variations across different legal publishers

### Option 2: Pre-process DOCX Files to Add Named Styles

If source documents use indentation without named styles:

1. Add a pre-processing step that:
   - Reads the DOCX XML directly (`document.xml` inside the ZIP)
   - Finds all paragraphs with `<w:ind w:left="720"/>` (0.5" indent = 720 twips)
   - Applies a named style like "Block Quotation" to those paragraphs
   - Writes the modified DOCX back

2. This would require a library like:
   - `docx-js` — manipulate DOCX structure
   - `officegen` — generate/modify Office documents
   - `open-docx` — open and modify DOCX files

**Estimated effort:** Moderate (requires XML parsing and DOCX rewriting)

### Option 3: Custom Mammoth Extension

Mammoth allows custom element handlers and styleMap rules. A more advanced option:

```javascript
const customStyleMap = [
  // Fallback: treat *any* paragraph with specific characteristics as blockquote
  // (would require access to raw OOXML, which mammoth doesn't currently expose)
];
```

**Status:** Not currently viable without mammoth API changes or a different library

## Recommendations

### Short-term (Recommended)

1. **Ensure source documents use named styles:**
   - Instruct content team: "Apply 'Block Quotation' style (not manual indent) to quoted passages"
   - Update any existing DOCX templates to include "Block Quotation" style definition

2. **Test with a sample document:**
   - Create a test DOCX with block quotations using "Block Quotation" style
   - Run `node scripts/process-cases.js`
   - Verify `<blockquote>` tags appear in `src/data/cases.json`

### Medium-term

1. If any source documents arrive with indentation (not named styles), pre-process them:
   ```bash
   # Future: Add pre-processing step to convert indentation → named styles
   node scripts/preprocess-docx.js raw-opinions/
   node scripts/process-cases.js
   ```

2. Document the requirement in content guidelines:
   - "All block quotations must use the 'Block Quotation' paragraph style"
   - Provide a Word template with the correct style defined

### Long-term

1. **Evaluate alternative DOCX libraries** that preserve indentation:
   - `docx` — more control over document structure
   - `libreoffice` — convert via libreoffice CLI (complex)
   - `pandoc` — convert via pandoc CLI (heavyweight)

2. **Consider a hybrid approach:**
   - Use mammoth for initial conversion (fast, clean)
   - If blockquotes not detected, fall back to secondary library/parser

## CSS Styling

The `<blockquote>` tags are styled in `.opinion-body` CSS rules. Currently in `globals.css`:

```css
.opinion-body blockquote {
  margin-left: 2rem;
  margin-right: 1rem;
  padding-left: 1rem;
  border-left: 3px solid rgba(0,0,0,0.2);
  color: rgba(0,0,0,0.85);
  /* Bluebok standard formatting */
}
```

Adjust these as needed for your design.

## Testing

To test blockquote detection:

```bash
# Run the parser
node scripts/process-cases.js

# Check if blockquotes were detected
node -e "
const cases = require('./src/data/cases.json');
cases.forEach(c => {
  const bqCount = (c.opinionText.match(/<blockquote>/g) || []).length;
  if (bqCount > 0) {
    console.log(\`✓ \${c.title}: \${bqCount} blockquotes\`);
  }
});
"
```

## Files Involved

- **Parser:** `scripts/process-cases.js`
  - Lines 267–289: `blockquoteStyleMap` — named style recognition
  - Lines 354–359: HTML processing pipeline

- **Component:** `src/components/CaseLawBox.tsx`
  - Displays the opinion body HTML with blockquote styling

- **Styling:** `app/globals.css`
  - `.opinion-body blockquote` rules

- **Data:** `src/data/cases.json`
  - Output JSON with `opinionText` HTML (contains `<blockquote>` if detected)

## See Also

- [Mammoth.js Documentation](https://github.com/mwilson/mammoth.js)
- [Bluebook Block Quotation Rules](https://www.law.du.edu/documents/denver-law-review/appendix-bluebook-citation-guide.pdf)
- [Word Paragraph Indentation (OOXML)](https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessingml.indentation)
