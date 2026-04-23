import os
import re
import json
import mammoth
from docx import Document
from bs4 import BeautifulSoup

# --- PRE-COMPILED REGEX OPTIMIZATIONS ---
DATE_CLEAN_RE = re.compile(r',\s*(Decided|Filed).*$', flags=re.IGNORECASE)
TITLE_SPLIT_RE = re.compile(r'\s+versus\s+|\s+v\.\s+', flags=re.IGNORECASE)
CORP_SUFFIX_RE = re.compile(r'\b(Inc\.|LLC|Co\.|Corp\.|et al\.)\b', flags=re.IGNORECASE)
NON_ALPHA_NUM_RE = re.compile(r'[^a-z0-9\s-]')
MULTI_HYPHEN_RE = re.compile(r'-+')
ONLY_ALPHA_NUM_RE = re.compile(r'[^a-z0-9]')
COUNSEL_SPLIT_RE = re.compile(r'\n|;|For ')
APPELLANT_RE = re.compile(r'\b(appellant|petitioner)s?\b', flags=re.IGNORECASE)
APPELLEE_RE = re.compile(r'\b(appellee|respondent)s?\b', flags=re.IGNORECASE)
FOOTNOTE_ID_RE = re.compile(r'\d+')
BACKLINK_RE = re.compile(r'^↑$')
PAGINATION_RE = re.compile(r'(\[\*+\d+\])')


class LexisParser:
    def __init__(self, filepath):
        self.filepath = filepath
        self.metadata = {
            "title": None,
            "court": None,
            "date": None,
            "docket": None,
            "notice": None,
            "judges": None,
            "opinion_by": None,
            "appellant_counsel": [],
            "appellee_counsel": []
        }
        self.ignore_list = []
        self.body_content = []
        self.footnotes = []
        self.case_id = ""

    def run(self):
        """Executes the full parsing pipeline."""
        print(f"Parsing: {self.filepath}")
        self._phase1_extract_metadata()
        self._phase2_and_3_process_body_and_footnotes()
        return self._generate_json()

    def _phase1_extract_metadata(self):
        """Reads .docx natively to extract header fields before the 'Opinion' marker."""
        doc = Document(self.filepath)
        
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

        if len(paragraphs) < 4:
            raise ValueError("Document does not contain enough paragraphs to be a valid Lexis export.")

        # 1. Basic Headers
        self.metadata["title"] = paragraphs[0]
        self.metadata["court"] = paragraphs[1]
        
        # Date cleaning
        self.metadata["date"] = DATE_CLEAN_RE.sub('', paragraphs[2]).strip()
        self.metadata["docket"] = paragraphs[3]

        # Factual Actor Ignore List (Split Title)
        title_parts = TITLE_SPLIT_RE.split(self.metadata["title"])
        for part in title_parts:
            # Clean common corporate suffixes to get the base name
            clean_name = CORP_SUFFIX_RE.sub('', part).strip('.,;:')
            if clean_name:
                self.ignore_list.append(clean_name)

        # Generate Case ID Slug (Optimized regex chaining)
        slug_title = NON_ALPHA_NUM_RE.sub('', self.metadata["title"].lower()).replace(' ', '-')
        slug_title = MULTI_HYPHEN_RE.sub('-', slug_title)
        slug_docket = ONLY_ALPHA_NUM_RE.sub('', self.metadata["docket"].lower())
        self.case_id = f"{slug_title}-{slug_docket}"

        # 2. Dynamic Metadata (Scan until "Opinion")
        in_counsel_block = False
        counsel_text_chunks = []

        for text in paragraphs[4:]:
            text_lower = text.lower()
            
            # The Trigger
            if text_lower == "opinion":
                break

            # Check for specific tags
            if text_lower.startswith("notice:"):
                self.metadata["notice"] = text.split(":", 1)[1].strip()
                in_counsel_block = False
                continue
            elif text_lower.startswith("judges:"):
                self.metadata["judges"] = text.split(":", 1)[1].strip()
                in_counsel_block = False
                continue
            elif text_lower.startswith("opinion by:"):
                self.metadata["opinion_by"] = text.split(":", 1)[1].strip()
                in_counsel_block = False
                continue
            elif text_lower.startswith("counsel:"):
                in_counsel_block = True
                counsel_text_chunks.append(text.split(":", 1)[1].strip())
                continue
            
            # If we are in a multi-line counsel block, keep appending
            if in_counsel_block:
                counsel_text_chunks.append(text)

        # 3. Process Counsel Logic
        if counsel_text_chunks:
            counsel_text = "\n".join(counsel_text_chunks)
            counsel_groups = COUNSEL_SPLIT_RE.split(counsel_text)
            
            for group in counsel_groups:
                group = group.strip()
                if not group: continue

                is_appellant = bool(APPELLANT_RE.search(group))
                is_appellee = bool(APPELLEE_RE.search(group))

                if is_appellant:
                    self.metadata["appellant_counsel"].append(group)
                elif is_appellee:
                    self.metadata["appellee_counsel"].append(group)
                else:
                    # Fallback Logic: Check against ignore list
                    if len(self.ignore_list) > 0 and self.ignore_list[0].lower() in group.lower():
                        self.metadata["appellant_counsel"].append(group)
                    elif len(self.ignore_list) > 1 and self.ignore_list[1].lower() in group.lower():
                        self.metadata["appellee_counsel"].append(group)
                    else:
                        # If totally ambiguous, default to appellant to prevent data loss
                        self.metadata["appellant_counsel"].append(group)

    def _phase2_and_3_process_body_and_footnotes(self):
        """Converts doc to HTML natively, isolates the opinion, and formats footnotes."""
        
        # Mammoth strictly preserves <w:i> (Word italics) as <em> or <i>
        with open(self.filepath, "rb") as docx_file:
            result = mammoth.convert_to_html(docx_file)
            html_content = result.value

        soup = BeautifulSoup(html_content, "html.parser")

        # 1. TRUNCATE PRE-OPINION GARBAGE
        opinion_tag = soup.find(
            lambda tag: tag.name in ['p', 'h1', 'h2', 'h3'] and tag.get_text(strip=True).lower() == "opinion"
        )
        
        if opinion_tag:
            next_tag = opinion_tag.find_next_sibling()
            if next_tag and not self.metadata["opinion_by"]:
                next_text = next_tag.get_text(strip=True)
                if len(next_text) < 150 and not next_text.startswith("[*"):
                    self.metadata["opinion_by"] = next_text.strip(':')
                    next_tag.extract()

            # Optimization: Bottom-up extraction of previous siblings is faster than find_all_previous()
            current = opinion_tag
            while current and current.parent:
                for prev in current.find_previous_siblings():
                    prev.extract()
                current = current.parent
            opinion_tag.extract()

        # 2. EXTRACT & REWRITE FOOTNOTES (Bi-Directional Engine)
        footnote_list = soup.find('ol')
        if footnote_list:
            for li in footnote_list.find_all('li'):
                fn_id = li.get('id', '')
                if not fn_id: continue
                
                num_match = FOOTNOTE_ID_RE.search(fn_id)
                num = num_match.group(0) if num_match else "0"
                
                new_fn_id = f"fn-{num}"
                return_id = f"ref-{num}"

                # Clean footnote content (Strip return links mammoth auto-generates)
                for backlink in li.find_all('a', text=BACKLINK_RE):
                    backlink.extract()
                
                cleaned_fn_content = self._sanitize_html_tags(li)

                self.footnotes.append({
                    "id": new_fn_id,
                    "return_id": return_id,
                    "content": cleaned_fn_content
                })
            footnote_list.extract()

        # 3. REWRITE INLINE ANCHORS IN BODY
        for a in soup.find_all('a', href=re.compile(r'^#footnote-')):
            href = a.get('href', '')
            num_match = FOOTNOTE_ID_RE.search(href)
            num = num_match.group(0) if num_match else "0"
            a['href'] = f"#fn-{num}"
            a['id'] = f"ref-{num}"
            a.string = num 
        
        # 4. BODY SANITATION & BLOCKQUOTE MAPPING
        for p in soup.find_all('p'):
            is_blockquote = False
            if p.has_attr('style') and 'margin-left' in p['style']:
                 is_blockquote = True
            
            cleaned_p_html = self._sanitize_html_tags(p)
            
            if cleaned_p_html.strip():
                self.body_content.append({
                    "type": "blockquote" if is_blockquote else "paragraph",
                    "content": cleaned_p_html
                })

    def _sanitize_html_tags(self, bs4_element):
        """Applies Phase 4 Strictness: strips external hyperlinks, formats pagination markers."""
        
        # Strip Lexis Hyperlinks
        for a in bs4_element.find_all('a'):
            if not a.get('id', '').startswith('ref-'):
                a.replace_with(a.get_text())

        # Decode inner HTML to string (Optimized using map)
        html_str = "".join(map(str, bs4_element.contents)).strip()
        
        # Wrap pagination markers efficiently using pre-compiled regex
        html_str = PAGINATION_RE.sub(r'<span class="pagination-marker">\1</span>', html_str)
        
        return html_str

    def _generate_json(self):
        """Assembles the final dictionary matching the Target Schema."""
        return {
            "case_id": self.case_id,
            "metadata": self.metadata,
            "body": self.body_content,
            "footnotes": self.footnotes
        }

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python lexis_parser.py <path_to_docx_file>")
        sys.exit(1)

    target_file = sys.argv[1]
    
    if not os.path.exists(target_file):
        print(f"Error: File '{target_file}' not found.")
        sys.exit(1)

    try:
        parser = LexisParser(target_file)
        result_json = parser.run()
        
        output_filename = parser.case_id + ".json"
        with open(output_filename, "w", encoding="utf-8") as f:
            json.dump(result_json, f, indent=2, ensure_ascii=False)
            
        print(f"Success! Output saved to {output_filename}")
        
    except Exception as e:
        print(f"An error occurred during parsing: {str(e)}")
