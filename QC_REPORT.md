# Quality Control Report: Case Law Archive

**Date:** April 17, 2026  
**Scope:** All 205 cases in archive  
**Audited By:** Automated QC Script

## Executive Summary

✓ **STRUCTURAL HTML:** All cases have balanced HTML (0 issues)  
⚠ **CONTENT LOSS:** 4 cases with severe truncation detected  
✓ **NEW CASES (10):** 9 cases fully intact, 1 has minor tag issue

---

## Critical Findings

### 1. SEVERE TRUNCATION (Immediate Action Required)

These cases have < 30% of expected content extracted:

| Case | DOCX Size | Opinion Size | Ratio | Loss |
|------|-----------|--------------|-------|------|
| Fleureme v. City of Atlanta | 27.4 KB | 718 B | **2.6%** | 26.7 KB |
| Harris v. State | 57.3 KB | 13.9 KB | **24.2%** | 43.4 KB |
| Brown v. State (case 1) | 28.1 KB | 8.0 KB | **28.5%** | 20.1 KB |
| Brown v. State (case 2) | 28.1 KB | 6.1 KB | **21.8%** | 22.0 KB |

**Impact:** Readers will see severely incomplete opinions.

**Root Cause:** Mammoth DOCX-to-HTML conversion failing on these specific files (likely complex formatting, headers/footers, embedded objects).

---

## New Cases Quality Status (10 Cases Added 4/17)

✓ Badie v. State - HTML balanced
✓ Bodie v. State - HTML balanced  
✓ Fadesire v. State - HTML balanced
✓ GEICO Indem. Co. v. Abdel-Rahman - HTML balanced
⚠ **Garrett v. Sandersville R.R. Co.** - HTML balanced (recently fixed - was truncated at 7.1K, now 25K)
⚠ Gines v. State - HTML balanced (minor inline tag variations)
✓ Henry County v. Greater Atlanta - HTML balanced
✓ Neal v. State - HTML balanced
✓ Doe v. Archdiocese of Atlanta - HTML balanced
✓ Rainey v. State - HTML balanced

**Action Taken on Garrett:** Full opinion re-extracted from DOCX (7.1K → 25K). Pushed 4/17 20:37 UTC.

---

## Recommendations

### Immediate (P0)
1. Re-parse the 4 truncated cases using direct DOCX extraction (not Mammoth)
2. Verify Garrett fix displays correctly in production
3. Add file size ratio check to parsing pipeline (warn if < 30%)

### Short Term (P1)
1. Implement automated QC on all new case ingestions
2. Add opinion length validation before committing
3. Create fallback parsing method for complex DOCX files

### Long Term (P2)
1. Evaluate alternative DOCX → HTML libraries (python-docx, docxpy)
2. Set minimum opinion length thresholds by case type
3. Build case completeness metrics into editorial workflow

---

## Technical Details

**HTML Structural Integrity:** Checked <p>, <div>, <blockquote>, <ol>, <ul>, <li>, <table> tags across all 205 cases. All balanced. ✓

**New Cases Ratio Check:** Ratio of opinion text to estimated DOCX overhead. New cases all > 30% except:
- Garrett v. Sandersville: Now 100% (fixed)
- Pre-existing cases: 4 critical, 196 acceptable

**Testing:** Manual verification shows case pages render correctly with balanced HTML.

