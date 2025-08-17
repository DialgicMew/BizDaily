from __future__ import annotations

from datetime import date
from typing import List, Dict, Any, Union
import os
import re
from dotenv import load_dotenv
import httpx
from openai import OpenAI


_VAL_LINE_RE = re.compile(r"\*\*Valuation:\*\*\s*(.*)")
_FUNDING_LINE_RE = re.compile(r"\*\*Funding round:\*\*\s*(.*)")
_USE_OF_FUNDS_RE = re.compile(r"\*\*Use of funds.*?\*\*\s*–\s*(.*)")
_CUSTOMER_SEG_RE = re.compile(r"\*\*Customer / Segment focus:\*\*\s*–\s*(.*)")
_SOURCES_RE = re.compile(r"\*\*Sources:\*\*\s*(.*)")

load_dotenv()

http_client = httpx.Client()
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    http_client=http_client
)


def _split_funding_line(line: str):
    """Roughly parse 'Series B · $250 M · 2025-04-15 · led by X, Y'"""
    parts = [p.strip() for p in re.split(r"·|,", line)]
    stage = None
    amount = None
    date_ = None
    lead_investors = None

    if parts:
        stage = parts[0]
    # Attempt to find amount ($xxx) and date (YYYY-MM-DD)
    for p in parts[1:]:
        if re.search(r"\$|USD|EUR|INR", p, re.I):
            amount = p
        elif re.match(r"\d{4}-\d{2}-\d{2}", p):
            date_ = p
        elif "led by" in p.lower() or "lead" in p.lower():
            lead_investors = p.replace("led by", "").strip()

    # Fallback join
    if not lead_investors and "led by" in line:
        lead_investors = line.split("led by", 1)[1].strip()

    # Currency extraction
    currency = None
    if amount and "$" in amount:
        currency = "$"

    return stage, amount, date_, lead_investors


def get_company_details(company: str) -> Dict[str, Any]:

    company_str = company
    as_of_date=date.today()
    
    template_prompt = f"""You are a concise venture-funding analyst.

TASK  
For the very recently fundedcompany below, craft an expanded brief based on extensive research.
(Do **not** look for additional firms.)

INPUT  
  • Date: {as_of_date}  
  • Company: {company_str}

OUTPUT – one Markdown block per company, ≤500 words, using these delimiters exactly:

---SECTION:CompanyName---
{{Company Name}}

---SECTION:Valuation---
{{post-money or "N/A"}}

---SECTION:FundingRound---
{{round, amount, date, lead investors}}

---SECTION:UseOfFunds---
{{1-2 short bullets}}

---SECTION:WhyProblem---
*100-120 words* Explain the pain point, its scale, and why it's urgent **now** (quote an industry datapoint if available).

---SECTION:WhatSolution---
*100-120 words* Describe the product suite, flagship features, and delivery form-factor (SaaS, API, hardware, etc.).

---SECTION:HowExecution---
*80-100 words* Outline the operating model—GTM, core tech, partnerships, or regulatory wedge that powers growth.

---SECTION:CustomerSegment---
{{primary user / buyer personas}}

---SECTION:FoundersTeamDNA---
  – {{Name, role}} – {{one-liner background}} – [LinkedIn](URL)  
  – {{repeat for key execs}}

---SECTION:TractionSnapshot---
{{users, revenue, KPIs, YoY growth}}

---SECTION:CompetitiveEdge---
Up to **3 bullets** (≤25 words each) on moats—proprietary data, network effects, patents, cost advantage, unique GTM, etc.

---SECTION:Pivots---
List any significant strategic changes (business model, target market, core product) with **date + one-line rationale**. If none are public, write "None disclosed."

---SECTION:KeyRisksOpenQuestions---
{{2-3 bullets}}

---SECTION:Sources---
{{hyperlinked article titles or raw URLs}}

---COMPANY-END---

FORMATTING RULES  
1. Each paragraph ≤60 words; bullets ≤40 words.  
2. Skip any section if data isn't public, but keep the delimiter.  
3. Place ---SECTION:Sources--- last for quick verification.
"""

    # Build the tools array
    use_web_search=True
    force_web_search=True
    search_context_size="high"

    tools = []
    if use_web_search:
        tool_config = {"type": "web_search_preview"}
        if search_context_size:
            tool_config["search_context_size"] = search_context_size
        tools.append(tool_config)

    # Build the request parameters
    request_params = {
        "model": "gpt-4.1",
        "input": template_prompt,
        "temperature": 0.0,
    }
    if tools:
        request_params["tools"] = tools
    if force_web_search:
        request_params["tool_choice"] = {"type": "web_search_preview"}

    response = client.responses.create(**request_params)

    print(response)

    try:
        output_text = response.output[1].content[0].text
        sections = extract_sections(output_text)
        return sections
    except Exception as e:
        print("Failed to extract sections:", e)

def extract_sections(output_text: str) -> dict:
    """
    Extracts sections from the output text using the ---SECTION:SectionName--- delimiters.
    Returns a dictionary mapping section names to their content.
    """
    import re
    section_pattern = re.compile(
        r"---SECTION:(?P<name>[A-Za-z0-9]+)---\n(?P<content>.*?)(?=\n---SECTION:|---COMPANY-END---|$)",
        re.DOTALL
    )
    sections = {}
    for match in section_pattern.finditer(output_text):
        name = match.group("name").strip()
        content = match.group("content").strip()
        sections[name] = content
    return sections

